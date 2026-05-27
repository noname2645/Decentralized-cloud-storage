const NebulaStorage = artifacts.require("NebulaStorage");

module.exports = function (deployer) {
  deployer.deploy(NebulaStorage);
};