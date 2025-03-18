// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

contract PinataStorage {
    struct File {
        string name; // File name
        string ipfsHash; // IPFS CID from Pinata
        address uploader; // Address of the uploader
    }

    mapping(uint256 => File) public files;
    uint256 public fileCount;

    event FileUploaded(uint256 indexed fileId, string name, string ipfsHash, address uploader);

    function uploadFile(string memory _name, string memory _ipfsHash) public {
        require(bytes(_ipfsHash).length > 0, "IPFS hash is required");
        require(bytes(_name).length > 0, "File name is required");

        fileCount++;
        files[fileCount] = File(_name, _ipfsHash, msg.sender);

        emit FileUploaded(fileCount, _name, _ipfsHash, msg.sender);
    }

    function getFile(uint256 _fileId) public view returns (string memory, string memory, address) {
        require(_fileId > 0 && _fileId <= fileCount, "Invalid file ID");

        File memory file = files[_fileId];
        return (file.name, file.ipfsHash, file.uploader);
    }
}
