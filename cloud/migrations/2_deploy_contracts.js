const PinataStorage = artifacts.require("PinataStorage");

module.exports=function(deployer) {
    deployer.deploy(PinataStorage,"Hello blockchain");
};