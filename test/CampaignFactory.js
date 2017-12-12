var Web3 = require('web3')

const CampaignFactory = artifacts.require('./CampaignFactory.sol')
const web3 = new Web3("localhost:8545")

contract('CampaignFactory', function (accounts) {
  const evmThrewError = (err) => {
    if (err.toString().includes('VM Exception while executing eth_call: invalid opcode')) {
      return true
    }
    return false
  }

  var future = parseInt((Date.now()/1000) + (15*60), 10)

  // CREATE CAMPAIGN
  it('should verify a Campaign once deployed has been created successfully', function () {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        ctr.checkForCampaign(result)
        .then((check) => {
          assert(check)
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

  it('should log a CampaignCreation event on createCampaign', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        // console.log(result.logs[0].event)
        assert(result.logs[0].event.includes("CampaignCreated"))
      }).catch((err) => {
        throw new Error(err)
      })
    }).catch((err) => {
      throw new Error(err)
    })
  })

  // // CHECK FOR CAMPAIGN
  it('should successfully validate that addresses are campaigns', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {

        // True check
        ctr.checkForCampaign(result)
        .then((check) => {
          assert(check)
        }).catch((err) => {
          throw new Error(err)
        })

        // False Check
        ctr.checkForCampaign(0)
        .then((check) => {
          assert(!check)
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

  // START CAMPAIGN
  it('should start the campaign', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        ctr.startCampaign(result, {from: accounts[0]})
        .then((res) => {
          result.stage()
          .then((res) => {
            assert(res, 1)
          }).catch((err) => {
            throw new Error(err)
          })
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

  it('should log a CampaignStarted event on startCampaign', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        ctr.startCampaign(result, {from: accounts[0]})
        .then((res) => {
          assert(result.logs[0].event.includes("CampaignStarted"))
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

  // SET TAG
  it('should set the tag on the campaign', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        ctr.setTag(result, "test", "meme", {from: accounts[0]})
        .then((res) => {
          result.getTag("test")
          .then((res) => {
            assert.strictEqual(res, ["meme"])
          }).catch((err) => {
            throw new Error(err)
          })
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

  it('should emit the CampaignTagged event on setTag', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        ctr.setTag(result, "test", "meme", {from: accounts[0]})
        .then((res) => {
          assert(res.logs[0].event.includes("CampaignTagged"))
          result.getTag("test")
          .then((res) => {
            assert.strictEqual(res, ["meme"])
          }).catch((err) => {
            throw new Error(err)
          })
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

  // SETTLE CAMPAIGN
  it('should settle the campaign', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should emit a CampaignEnded event', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
        result.startCampaign()
        .then(function(res) {
          // Campaign started
          Promise(resolve => setTimeout(resolve, 8000).then(() => {

            result.settleCampaign()
            .then((res) => {
              // Campaign Settled
              assert(res.logs[0].event.includes("CampaignEnded"))
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should emit a CampaignSuccessful event for success campaigns', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
        result.startCampaign()
        .then(function(res) {
          // Campaign started

          // Contribute 2; goal is 1
          result.contribute(accounts[0], {from: accounts[0], value: 2})
          .catch((err) => {
            throw new Error(err)
          })

          Promise(resolve => setTimeout(resolve, 8000).then(() => {

            result.settleCampaign()
            .then((res) => {
              // Campaign Settled
              assert(res.logs[0].event.includes("CampaignSucceeded"))
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should emit a CampaignFailed event for fail campaigns', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
        result.startCampaign()
        .then(function(res) {
          // Campaign started
          Promise(resolve => setTimeout(resolve, 8000).then(() => {

            result.settleCampaign()
            .then((res) => {
              // Campaign Settled
              assert(res.logs[0].event.includes("CampaignFailed"))
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  // REFUND
  it('should refund the campaign funds', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then(() => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should emit a CampaignRefund event on refund', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then(() => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
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
                  assert(res.logs[0].event.includes("CampaignRefund"))
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  // WITHDRAW
  it('should withdraw the campaign funds', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then(() => {
      ctr.createCampaign(1, now, 0, {from: accounts[0]})
      .then((result) => {
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  it('should emit a CampaignWithdraw event on withdraw', function() {
    let now = (new Date())/1000 + 5
    CampaignFactory.new()
    .then(() => {
      ctr.createCampaign(1, now, 1, {from: accounts[0]})
      .then((result) => {
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
    }).catch((err) => {
      throw new Error(err)
    })
  })

  // SET ATTRIBUTE
  it('should set the attribute successfully on a campaign', function() {
    CampaignFactory.new()
    .then((ctr) => {
      ctr.createCampaign(1, future, 1, {from: accounts[0]})
      .then((result) => {
        ctr.setAttribute(result, "test", "meme", {from: accounts[0]})
        .then((res) => {
          result.getAttribute("test")
          .then((res) => {
            assert.strictEqual(res, "meme")
          }).catch((err) => {
            throw new Error(err)
          })
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

})
