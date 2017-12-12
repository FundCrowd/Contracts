pragma solidity ^ 0.4.13;
import "./Campaign.sol";


/// @title Campaign Factory contract - Allows to create campaign contracts
contract CampaignFactory {

    /* 
     *  Events
     */
    event CampaignCreation(address indexed campaign, address indexed creator, uint goal, uint deadline);

    /*
     *  Campaign Specific Events
     */
    event CampaignStarted(address indexed campaign);
    event CampaignFunded(address indexed campaign, address indexed sender, uint funding);
    event CampaignEnded(address indexed campaign);
    event CampaignFailed(address indexed campaign);
    event CampaignSucceeded(address indexed campaign);
    event CampaignRefund(address indexed campaign, address indexed sender, uint refund);
    event CampaignWithdrawl(address indexed campaign, address indexed creator, uint total);
    event CampaignTagged(address indexed campaign, bytes32 indexed tag, bytes32 indexed value);

    mapping(address => bool) public isCampaign; // used to check what is and is not a campaign

    /*
     *  Public functions
     */
    /// @dev Creates a new campaign contract
    /// @param goal Amount needed for success
    /// @param deadline Campaign deadline
    /// @return Campaign contract
    function createCampaign(uint goal, uint deadline, uint donation)
        public
        returns (Campaign)
    {
        Campaign campaign = new Campaign(msg.sender, goal, deadline, donation);
        isCampaign[address(campaign)] = true;
        CampaignCreation(address(campaign), msg.sender, goal, deadline);
        return campaign;
    }

    /// @dev check to see if the addres is a Campaign contract
    /// @param _campaign the address of the campaign to be checked
    function checkForCampaign(address _campaign)
        public
        constant
        returns (bool)
    {
        return isCampaign[_campaign];
    }

    function startCampaign(address _campaign)
        public
    {
        require(isCampaign[_campaign]== true);
        Campaign campaign = Campaign(_campaign); 
        require(campaign.creator() == msg.sender);
        campaign.startCampaign();
        CampaignStarted(_campaign);
    }

    function setTag(address _campaign, bytes32 key, bytes32 value)
        public
    {
        require(isCampaign[_campaign]==true);
        Campaign campaign = Campaign(_campaign); 
        require(campaign.creator() == msg.sender);
        campaign.setTag(key,value);
        CampaignTagged(_campaign,key,value);
    } 

    function contribute(address _campaign) 
        public
        payable
    {
        require(isCampaign[_campaign]==true);
        Campaign campaign = Campaign(_campaign); 
        campaign.contribute.value(msg.value)(msg.sender);
        CampaignFunded(_campaign, msg.sender, msg.value);
    }

    function settleCampaign(address _campaign)
        public
    {
        require(isCampaign[_campaign]==true);
        Campaign campaign = Campaign(_campaign); 
        bool successful = campaign.settleCampaign();
        if (successful)
            CampaignSucceeded(_campaign);
        else
            CampaignFailed(_campaign);
        CampaignEnded(_campaign);
    }

    function refund(address _campaign)
        public 
        returns (uint refundAmount)
    {
        require(isCampaign[_campaign]==true);
        Campaign campaign = Campaign(_campaign); 
        refundAmount = campaign.refund(msg.sender);
        CampaignRefund(address(this), msg.sender, refundAmount);
    }

    function withdraw(address _campaign)
        public
        returns (uint withdrawlAmount)
    {
        require(isCampaign[_campaign]==true);
        Campaign campaign = Campaign(_campaign); 
        require(campaign.creator() == msg.sender);
        withdrawlAmount = campaign.withdraw();
        CampaignWithdrawl(_campaign, msg.sender, withdrawlAmount);
    }

    function setAttribute(address _campaign, bytes32 key, string value) 
        public
    {
        require(isCampaign[_campaign]==true);
        Campaign campaign = Campaign(_campaign); 
        require(campaign.creator() == msg.sender);
        campaign.setAttribute(key,value);
    }
}
