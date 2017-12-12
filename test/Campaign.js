var Web3 = require('web3')

const Campaign = artifacts.require('./Campaign.sol')
const web3 = new Web3("localhost:8545")

contract('Campaign', function (accounts) {
  const evmThrewError = (err) => {
    if (err.toString().includes('VM Exception while executing eth_call: invalid opcode')) {
      return true
    }
    return false
  }

  const evmThrewErrorWhileProcTrans = (err) => {
    if (err.toString().includes('VM Exception while processing transaction: invalid opcode')) {
      return true
    }
    return false
  }

  var future = parseInt((Date.now()/1000) + (15*60), 10)


  it('should create a new contract with a goal of 1 and deadline of 15 minutes in the future', function () {
  	var ctr;
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function (result) {
    	ctr = result;
    	return ctr.creator.call()
    }).then(function(result) {
    	assert.strictEqual(result, accounts[0])
    	return ctr.goal.call()
    }).then(function(result) {
    	assert.strictEqual(result.toNumber(), 1)
    	return ctr.deadline.call()
    }).then(function(result) {
    	assert.strictEqual(result.toNumber(), future)
    }).catch((err) => { throw new Error(err) })
  })

  it('should fail creation when address is 0', function () {
    Campaign.new(0, 1, future, 1, {from: accounts[0]}).then(function(result) {
      assert(false, "Failed on successful creation")
    }).catch((err) => {
      assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
    })
  })

  it('should fail creation when goal is negative', function() {
    let goal = -1
    Campaign.new(0, goal, future, 1, {from: accounts[0]}).then(function(result) {
      assert(false, "Failed on successful creation")
    }).catch((err) => {
      assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
    })
  })

  it('should fail creation when deadline before now', function () {
    var now = parseInt((Date.now()/1000), 10)
    Campaign.new(accounts[0], 1, now-10, 1, {from: accounts[0]}).then(function (result) {
      assert(false, "Failed on successful creation")
    }).catch((err) => {
      assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
    })
  })

  it('should fail creation when donation is greater than 100% and less than 0', function() {
    var donation = 101;
    Campaign.new(accounts[0], 1, future, donation, {from: accounts[0]}).then(function (result) {
      assert(false, "Failed on successful creation")
    }).catch((err) => {
      assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
    })

    var donation = -1;
    Campaign.new(accounts[0], 1, future, donation, {from: accounts[0]}).then(function (result) {
      assert(false, "Failed on successful creation")
    }).catch((err) => {
      assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
    })
  })

  // FALLBACK
  it('should fail payment when stage is not Started', function() {

  })

  // ATTRIBUTES
  it('should set and get attributes', function () {
    var ctr;
    Campaign.new(1, accounts[0], 1, future, {from: accounts[0]}).then(function (result) {
      ctr = result;
      return ctr.setAttribute("test", "meme")
    }).then(function(result) {
      console.log(result)
      var test = ctr.getAttribute("test").call()
      assert.strictEqual(test, "meme");
    }).catch((err) => { 
      console.log(err)
      throw new Error(err) })
  })

  it('should fail setAttribute after campaign started', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function (result) {
        ctr.setAttribute("test", "meme")
        .then(function (result) {
          assert(false, "Failed on successful setAttr")
        }).catch((err) => {
          assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
        })
      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  // Tags
  it('should set and get tags', function () {
    var ctr;
    Campaign.new(1, accounts[0], 1, future, {from: accounts[0]}).then(function (result) {
      ctr = result;
      return ctr.setTag("test", "meme")
    }).then(function(result) {
      console.log(result)
      var test = ctr.getTag("test").call()
      assert.strictEqual(test, ["meme"]);
    }).catch((err) => { 
      console.log(err)
      throw new Error(err) })
  })

  it('should fail setTag after campaign started', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function (result) {
        ctr.setTag("test", "meme")
        .then(function (result) {
          assert(false, "Failed on successful setTag")
        }).catch((err) => {
          assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
        })
      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  // START
  it('should start the campaign', function() {
      Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function (result) {
        result.startCampaign()
        .then(function(res) {
          result.stage()
          .then(function(res) {
            assert.strictEqual(res, 1)
          }).catch((err) => {
            throw new Error(err)
          })
        }).catch((err) => {
          throw new Error(err)
        })
      }).catch((err) => {
        throw new Error(err)
      })
  })

  it('should require the campaign has not been started on start', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        
        result.startCampaign()
        .then(function(res) {
          throw new Error(err)
        }).catch((err) => {
          assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
        })

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should require the campaign has not already ended on start', function() {
    let now = (new Date())/1000 + 1
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function (result) {

      // Wait 2s to reach deadline
      Promise(resolve => setTimeout(resolve, 2000).then(() => {
        result.startCampaign()
        .then(function(res) {
          
          result.startCampaign()
          .then(function(res) {
            throw new Error(err)
          }).catch((err) => {
            assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
          })
        }).catch((err) => {
          throw new Error(err)
        })
      })
      )
    }).catch((err) => {
      throw new Error(err)
    })
  })

  // CONTRIBUTE
  it('should contribute to the campaign', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function(result) {
      result.contribute(accounts[0], {from: accounts[0], value: 2})
      .then((res) => {
        result.total()
        .then((total) => {
          assert.strictEqual(total, 2)
        }).catch((err) => {
          throw new Error(err)
        })
      }).catch((err) => {
        throw new Error(err)
      })
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should fail contribute when campaign stage not started', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function(result) {

      // Campaign stage is created (not started)

      result.contribute(accounts[0], {from: accounts[0], value: 2})
      .then((res) => {
        throw new Error(err)
      }).catch((err) => {
        assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
      })
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should fail contribute when the campaign has timed out', function() {
    let now = (new Date())/1000 + 1
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function(result) {

      // wait 2s
      Promise(resolve => setTimeout(resolve, 2000).then(() => {
        result.contribute(accounts[0], {from: accounts[0], value: 2})
        .then((res) => {
          throw new Error(err)
        }).catch((err) => {
          assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
        })
      }))
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should get the contributions of the address', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function(result) {
      result.contribute(accounts[0], {from: accounts[0], value: 2})
      .then((res) => {
        result.getContribution(accounts[0])
        .then((contrib) => {
          assert.strictEqual(contrib, 2)
        }).catch((err) => {
          throw new Error(err)
        })
      }).catch((err) => {
        throw new Error(err)
      })
    }).catch((err) => {
      throw new Error(err)
    })
  })

  // SETTLE
  it('should settle the failed campaign', function() {
    let now = (new Date())/1000 + 5
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started
        Promise(resolve => setTimeout(resolve, 8000).then(() => {

          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 3 == CampaignFailed
              assert.strictEqual(res, 3)
            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should settle the successful campaign', function() {
    let now = (new Date())/1000 + 5
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        // Contribute 2; goal is 1; accounts[0] has 100 eth on testrpc
        result.contribute(accounts[0], {from: accounts[0], value: 2})
        .catch((err) => {
          throw new Error(err)
        })

        Promise(resolve => setTimeout(resolve, 8000).then(() => {
          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 2 == CampaignSuccessful
              assert.strictEqual(res, 2)
            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should fail to settle if the campaign has not ended', function() {
    Campaign.new(accounts[0], 1, future, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        result.settleCampaign()
        .then((res) => {
          // Campaign Settled
          throw new Error(err)

        }).catch((err) => {

          // Assert has not changed
          result.stage()
          .then(function(res) {
            // 1 == CampaignStarted
            assert.strictEqual(res, 3)
          }).catch((err) => {
            throw new Error(err)
          })

          assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
        })

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  // WITHDRAW
  it('should withdraw the funds from a campaign', function() {
    let now = (new Date())/1000 + 5
    let beforeBalance = web3.eth.getBalance(accounts[0]) // TODO
    Campaign.new(accounts[0], 1, now, 0, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        // Contribute 2; goal is 1; accounts[0] has 100 eth on testrpc
        result.contribute(accounts[0], {from: accounts[0], value: 2})
        .catch((err) => {
          throw new Error(err)
        })

        Promise(resolve => setTimeout(resolve, 8000).then(() => {
          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 2 == CampaignSuccessful
              assert.strictEqual(res, 2)

              result.withdraw()
              .then((res) => {
                assert.strictEqual(beforeBalance, web3.eth.getBalance(accounts[0]))
              }).catch((err) => {
                throw new Error(err)
              })

            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should fail withdraw if the campaign is not successful', function() {
    let now = (new Date())/1000 + 5
    let beforeBalance = web3.eth.getBalance(accounts[0]) // TODO
    let contributionAmount = 0.5
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        // Contribute 0.5; goal is 1; accounts[0] has 100 eth on testrpc
        result.contribute(accounts[0], {from: accounts[0], value: contributionAmount})
        .catch((err) => {
          throw new Error(err)
        })

        Promise(resolve => setTimeout(resolve, 8000).then(() => {
          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 3 == CampaignFailed
              assert.strictEqual(res, 3)

              result.withdraw()
              .then((res) => {
                assert.strictEqual(beforeBalance-contributionAmount, web3.eth.getBalance(accounts[0]))
              }).catch((err) => {
                throw new Error(err)
              })

            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should donate when donation amount is greater than 0', function() {
    let now = (new Date())/1000 + 5
    let beforeBalance = web3.eth.getBalance(accounts[0])
    let contribAmount = 2
    let donationPercent = 1
    Campaign.new(accounts[0], 1, now, donationPercent, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        // Contribute 2; goal is 1; accounts[0] has 100 eth on testrpc
        result.contribute(accounts[0], {from: accounts[0], value: contribAmount})
        .catch((err) => {
          throw new Error(err)
        })

        Promise(resolve => setTimeout(resolve, 8000).then(() => {
          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 2 == CampaignSuccessful
              assert.strictEqual(res, 2)

              result.withdraw()
              .then((res) => {
                assert.strictEqual(beforeBalance, web3.eth.getBalance(accounts[0]))

                // MAINNET
                // assert.strictEqual(contribAmount * (donationPercent/100), web3.eth.getBalance("0xb7D37D72695260E9dcb51bbf1cf89Cf360198B5f"))

                // ROPSTEN
                assert.strictEqual(contribAmount * (donationPercent/100), web3.eth.getBalance("0x93D14ae64e2649C61f8bF76a202F6909B94bC22d"))
              }).catch((err) => {
                throw new Error(err)
              })

            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  // REFUND
  it('should refund funds from a campaign', function() {
    let now = (new Date())/1000 + 5
    let beforeBalance = web3.eth.getBalance(accounts[0]) // TODO
    let contributionAmount = 0.5
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        // Contribute 0.5; goal is 1; accounts[0] has 100 eth on testrpc
        result.contribute(accounts[0], {from: accounts[0], value: contributionAmount})
        .catch((err) => {
          throw new Error(err)
        })

        Promise(resolve => setTimeout(resolve, 8000).then(() => {
          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 3 == CampaignFailed
              assert.strictEqual(res, 3)

              result.refund()
              .then((res) => {
                assert.strictEqual(beforeBalance, web3.eth.getBalance(accounts[0]))
              }).catch((err) => {
                throw new Error(err)
              })

            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should fail to refund if the campaign did not fail', function() {
    let now = (new Date())/1000 + 5
    let beforeBalance = web3.eth.getBalance(accounts[0]) // TODO
    let contributionAmount = 2
    Campaign.new(accounts[0], 1, now, 1, {from: accounts[0]}).then(function (result) {

      result.startCampaign()
      .then(function(res) {
        // Campaign started

        // Contribute 2; goal is 1; accounts[0] has 100 eth on testrpc
        result.contribute(accounts[0], {from: accounts[0], value: contributionAmount})
        .catch((err) => {
          throw new Error(err)
        })

        Promise(resolve => setTimeout(resolve, 8000).then(() => {
          result.settleCampaign()
          .then((res) => {
            // Campaign Settled

            result.stage()
            .then(function(res) {
              // 2 == CampaignSucceeded
              assert.strictEqual(res, 2)

              result.refund()
              .then((res) => {
                throw new Error(err)
              }).catch((err) => {
                assert(evmThrewErrorWhileProcTrans(err), "Error was caught, but was null")
                assert.strictEqual(beforeBalance-contributionAmount, web3.eth.getBalance(accounts[0]))
              })

            }).catch((err) => {
              throw new Error(err)
            })

          }).catch((err) => {
           throw new Error(err)
          })
        }))

      }).catch((err) => {
        throw new Error(err)
      })

    }).catch((err) => {
      throw new Error(err)
    })
  })
})