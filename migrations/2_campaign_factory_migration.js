const CampaignFactory = artifacts.require(`./CampaignFactory.sol`)

module.exports = (deployer) => {
	deployer.deploy(CampaignFactory)
}
