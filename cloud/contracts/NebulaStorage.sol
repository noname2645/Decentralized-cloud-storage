// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title NebulaStorage
/// @notice Immutable on-chain registry of encrypted file CIDs.
///
///         Meta-transaction pattern (EIP-191 personal_sign):
///         - User signs a message off-chain (FREE — no gas)
///         - Backend relays the transaction and pays gas
///         - Contract recovers the signer address via ecrecover
///         - Recovered address is stored as the file owner
///
///         Result: on-chain ownership is the REAL user wallet,
///         users never pay gas, backend wallet is just a relay.
contract NebulaStorage {

    // ─── Data Structures ─────────────────────────────────────────────────────

    struct File {
        string  name;        // Original file name
        string  ipfsHash;    // IPFS CID (encrypted blob pinned on Pinata)
        address uploader;    // Actual user wallet (recovered from signature)
        uint256 timestamp;   // Block timestamp at upload
        bool    exists;      // Soft-delete flag
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public fileCount;

    mapping(uint256  => File)    public files;
    mapping(address  => uint256[]) public filesByOwner;

    /// @dev Replay-protection: track used nonces per user address
    mapping(address => uint256) public nonces;

    // ─── Events ───────────────────────────────────────────────────────────────

    event FileUploaded(
        uint256 indexed fileId,
        string  name,
        string  ipfsHash,
        address indexed uploader,
        uint256 timestamp
    );

    event FileDeleted(
        uint256 indexed fileId,
        address indexed owner
    );

    // ─── Custom Errors ────────────────────────────────────────────────────────

    error InvalidSignature();
    error EmptyHash();
    error EmptyName();
    error InvalidFileId();
    error NotOwner();
    error AlreadyDeleted();
    error SignatureExpired();

    // ─── Meta-upload: user signs, backend relays ──────────────────────────────

    /// @notice Register a file on-chain using a user-signed meta-transaction.
    ///         The backend calls this function and pays gas.
    ///         The user's wallet is recovered from the signature and stored as owner.
    ///
    /// @param _name      Original file name
    /// @param _ipfsHash  IPFS CID of the encrypted file
    /// @param _user      Claimed user wallet address
    /// @param _nonce     User's current nonce (prevents replay)
    /// @param _deadline  Unix timestamp after which the signature expires
    /// @param _signature 65-byte ECDSA signature from the user's wallet
    function uploadFileMeta(
        string  calldata _name,
        string  calldata _ipfsHash,
        address          _user,
        uint256          _nonce,
        uint256          _deadline,
        bytes   calldata _signature
    ) external {
        if (bytes(_ipfsHash).length == 0) revert EmptyHash();
        if (bytes(_name).length    == 0)  revert EmptyName();
        if (block.timestamp > _deadline)   revert SignatureExpired();
        if (_nonce != nonces[_user])       revert InvalidSignature();

        // Reconstruct the message the user signed
        bytes32 msgHash = keccak256(
            abi.encodePacked(_name, _ipfsHash, _user, _nonce, _deadline, address(this))
        );
        // EIP-191 prefix (matches MetaMask personal_sign)
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );

        address recovered = _recoverSigner(ethHash, _signature);
        if (recovered != _user) revert InvalidSignature();

        // Increment nonce (prevents replay of the same signature)
        nonces[_user]++;

        fileCount++;
        uint256 fileId = fileCount;

        files[fileId] = File({
            name:      _name,
            ipfsHash:  _ipfsHash,
            uploader:  _user,       // Real user wallet — not msg.sender (relay)
            timestamp: block.timestamp,
            exists:    true
        });

        filesByOwner[_user].push(fileId);

        emit FileUploaded(fileId, _name, _ipfsHash, _user, block.timestamp);
    }

    /// @notice Soft-delete a file. Also requires a user signature (gasless).
    function deleteFileMeta(
        uint256 _fileId,
        address _user,
        uint256 _nonce,
        uint256 _deadline,
        bytes   calldata _signature
    ) external {
        if (_fileId == 0 || _fileId > fileCount) revert InvalidFileId();
        if (block.timestamp > _deadline)          revert SignatureExpired();
        if (_nonce != nonces[_user])              revert InvalidSignature();

        File storage f = files[_fileId];
        if (!f.exists)          revert AlreadyDeleted();
        if (f.uploader != _user) revert NotOwner();

        bytes32 msgHash = keccak256(
            abi.encodePacked("delete", _fileId, _user, _nonce, _deadline, address(this))
        );
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
        if (_recoverSigner(ethHash, _signature) != _user) revert InvalidSignature();

        nonces[_user]++;
        f.exists = false;
        emit FileDeleted(_fileId, _user);
    }

    // ─── Direct upload (fallback — user pays own gas, no relay needed) ────────

    /// @notice Standard upload where msg.sender IS the owner (user pays gas).
    ///         Kept as a fallback if user prefers direct signing.
    function uploadFile(string calldata _name, string calldata _ipfsHash) external {
        if (bytes(_ipfsHash).length == 0) revert EmptyHash();
        if (bytes(_name).length    == 0)  revert EmptyName();

        fileCount++;
        uint256 fileId = fileCount;

        files[fileId] = File({
            name:      _name,
            ipfsHash:  _ipfsHash,
            uploader:  msg.sender,
            timestamp: block.timestamp,
            exists:    true
        });

        filesByOwner[msg.sender].push(fileId);
        emit FileUploaded(fileId, _name, _ipfsHash, msg.sender, block.timestamp);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    function getFile(uint256 _fileId)
        external view
        returns (string memory name, string memory ipfsHash, address uploader, uint256 timestamp, bool exists)
    {
        if (_fileId == 0 || _fileId > fileCount) revert InvalidFileId();
        File memory f = files[_fileId];
        return (f.name, f.ipfsHash, f.uploader, f.timestamp, f.exists);
    }

    function getFilesByOwner(address _owner)
        external view returns (uint256[] memory)
    {
        return filesByOwner[_owner];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _recoverSigner(bytes32 _ethHash, bytes calldata _sig)
        internal pure returns (address)
    {
        require(_sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8   v;
        assembly {
            r := calldataload(_sig.offset)
            s := calldataload(add(_sig.offset, 32))
            v := byte(0, calldataload(add(_sig.offset, 64)))
        }
        if (v < 27) v += 27;
        return ecrecover(_ethHash, v, r, s);
    }
}
