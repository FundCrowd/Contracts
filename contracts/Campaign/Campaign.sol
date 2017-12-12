pragma solidity ^0.4.13;

contract Campaign {
    /*
     *  Storage
     */
    enum Stages {
        CampaignCreated,
        CampaignStarted,
        CampaignSuccessful,
        CampaignFailed
    }

    // Mandatory - passed
    address public campaignFactory;
    address public creator;
    uint public goal;
    uint public deadline;
    uint public donation;

    // Stored
    Stages public stage;
    uint public total;
    mapping (address => uint) public contributions;
    mapping (bytes32 => bytes32[]) public tags;
    mapping (bytes32 => string) public attributes;

    /*
     *  Modifiers
     */
    modifier atStage(Stages _stage) {
        // Contract has to be in given stage
        require(stage == _stage);
        _;
    }

    modifier onlyCreator() {
        // Only creator is allowed to proceed
        require (msg.sender == creator);
        _;
    }

    modifier onlyCreatorOrCampaignFactory() {
        // Only creator is allowed to proceed
        require (msg.sender == creator || msg.sender == campaignFactory);
        _;
    }
    /// @dev verified the
    modifier notEnded() {
        require (now < deadline);
        _;
    }

    modifier ended() {
        require (now >= deadline);
        _;
    }

    modifier fromCampaignFactory() {
        require (msg.sender == address(campaignFactory));
        _;
    }

    /*
     *  Public functions
     */
    /// @dev Constructor validates and sets campaign properties
    /// @param _creator Address of the campaign's creator
    /// @param _deadline Campaign deadline
    /// @param _goal Min tokens required for successful campaign
    function Campaign(address _creator, uint _goal, uint _deadline, uint _donation) public {
        // Validate input
        require(_creator != 0
                && _goal >= 0 // TODO: unsigned ints are always >= 0, need to verify; check later?
                && now < _deadline
                && _donation <= 100
                && _donation >= 0);
        campaignFactory = msg.sender;
        creator = _creator;
        deadline = _deadline;
        goal = _goal;
        stage = Stages.CampaignCreated;
        total = 0; // TODO: remove if defaults to zero
        donation = _donation;
    }
    
    /// @dev fallback function
    function() 
        public
        payable 
    {
        require (stage == Stages.CampaignStarted);
    }

    /// @dev Allows creator to add optional attributes
    /// @param key the key of the attr
    /// @param value the value of the attr
    function setAttribute(bytes32 key, string value) 
        public
        atStage(Stages.CampaignCreated)
        onlyCreatorOrCampaignFactory
    {
        attributes[key] = value;
    }

    function setTag(bytes32 key, bytes32 value)
        public
        atStage(Stages.CampaignCreated)
        fromCampaignFactory
    {
        tags[key].push(value);
    }

    /// @dev gets the attributes for the given key
    function getAttribute(bytes32 key) 
        public
        constant
        returns (string) 
    {
        return attributes[key];
    }

    function getTag(bytes32 key)
    public
    constant
    returns (bytes32[])
    {
        return tags[key];
    }

    /// @dev Allows campaign creator to start the campaign
    function startCampaign() 
        public
        atStage(Stages.CampaignCreated)
        fromCampaignFactory
        notEnded
    {
        stage = Stages.CampaignStarted;
    }

    /// @dev allows anyone to fund the campaign
    function contribute(address _contributor) //TODO: Is this a vunrability? Also where is transfer code
        public
        payable
        fromCampaignFactory
        atStage(Stages.CampaignStarted)
        notEnded
    {
        total += msg.value;
        contributions[_contributor] += msg.value;
    }

    /// @dev gets the contributions for the given address
    function getContribution(address _contributor) 
        public
        constant
        returns (uint) 
    {
        return contributions[_contributor];
    }   

    /// @dev Allows to end campaign
    function settleCampaign()
        public
        atStage(Stages.CampaignStarted)
        ended
        returns (bool)
    {
        if (total >= goal) {
            stage = Stages.CampaignSuccessful;
            return true;
        } else {
            stage = Stages.CampaignFailed;
            return false;
        }
    }

    /// @dev allows the creator to withdrawl their funding
    function withdraw()
        public
        atStage(Stages.CampaignSuccessful)
        fromCampaignFactory
        returns (uint withdrawlAmount)
    {
        withdrawlAmount = (this.balance * (100 - donation))/100;
        if (donation > 0) {
            // MAINNET
            //0xb7D37D72695260E9dcb51bbf1cf89Cf360198B5f.transfer(this.balance-withdrawlAmount);

            // ROPSTEN
            0x93D14ae64e2649C61f8bF76a202F6909B94bC22d.transfer(this.balance-withdrawlAmount);
        }
        total = 0;
        creator.transfer(withdrawlAmount);
    }

    /// @dev allows contributors to refund if failed
    function refund(address _contributor)
        public 
        fromCampaignFactory
        atStage(Stages.CampaignFailed)
        returns (uint refundAmount)
    {
        refundAmount = contributions[_contributor];
        contributions[_contributor] = 0;
        _contributor.transfer(refundAmount);
    }
}