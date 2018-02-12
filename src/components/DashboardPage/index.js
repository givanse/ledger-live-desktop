// @flow

import React, { PureComponent, Fragment } from 'react'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import chunk from 'lodash/chunk'
import random from 'lodash/random'
import takeRight from 'lodash/takeRight'

import type { MapStateToProps } from 'react-redux'
import type { Accounts } from 'types/common'

import { formatBTC } from 'helpers/format'
import { space } from 'styles/theme'

import { getTotalBalance, getVisibleAccounts } from 'reducers/accounts'

import { AreaChart } from 'components/base/Chart'
import Box, { Card } from 'components/base/Box'
import Pills from 'components/base/Pills'
import Text from 'components/base/Text'

import AccountCard from './AccountCard'

const mapStateToProps: MapStateToProps<*, *, *> = state => ({
  accounts: getVisibleAccounts(state),
  totalBalance: getTotalBalance(state),
})

const mapDispatchToProps = {
  push,
}

type Props = {
  accounts: Accounts,
  push: Function,
  totalBalance: number,
}

type State = {
  fakeDatas: Array<any>,
  selectedTime: string,
}

const ACCOUNTS_BY_LINE = 3
const TIMEOUT_REFRESH_DATAS = 5e3

const itemsTimes = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

const generateFakeData = v => ({
  name: `Day ${v}`,
  value: random(10, 100),
})

class DashboardPage extends PureComponent<Props, State> {
  state = {
    selectedTime: 'day',
    fakeDatas: this.generateFakeDatas(),
  }

  componentDidMount() {
    this.addFakeDatasOnAccounts()
  }

  componentWillUnmount() {
    clearTimeout(this._timeout)
  }

  getAccountsChunk() {
    const { accounts } = this.props

    // create shallow copy of accounts, to be mutated
    const listAccounts = [...accounts]

    while (listAccounts.length % ACCOUNTS_BY_LINE !== 0) listAccounts.push(null)

    return chunk(listAccounts, ACCOUNTS_BY_LINE)
  }

  generateFakeDatas() {
    const { accounts } = this.props
    return accounts.map(() => [...Array(25).keys()].map(v => generateFakeData(v + 1)))
  }

  addFakeDatasOnAccounts = () => {
    this._timeout = setTimeout(() => {
      const { accounts } = this.props

      this.setState(prev => ({
        fakeDatas: [
          ...accounts.reduce((res, acc, i) => {
            if (res[i]) {
              const nextIndex = res[i].length
              res[i][nextIndex] = generateFakeData(nextIndex)
            }
            return res
          }, prev.fakeDatas),
        ],
      }))

      this.addFakeDatasOnAccounts()
    }, TIMEOUT_REFRESH_DATAS)
  }

  _timeout = undefined

  render() {
    const { totalBalance, push, accounts } = this.props
    const { selectedTime, fakeDatas } = this.state

    const totalAccounts = accounts.length

    return (
      <Box flow={7}>
        <Box horizontal align="flex-end">
          <Box>
            <Text color="dark" ff="Museo Sans" fontSize={7}>
              {'Good morning, Khalil.'}
            </Text>
            <Text color="grey" fontSize={5} ff="Museo Sans|Light">
              {totalAccounts > 0
                ? `here is the summary of your ${totalAccounts} accounts`
                : 'no accounts'}
            </Text>
          </Box>
          <Box ml="auto">
            <Pills
              items={itemsTimes}
              activeKey={selectedTime}
              onChange={item => this.setState({ selectedTime: item.key })}
            />
          </Box>
        </Box>
        {totalAccounts > 0 && (
          <Fragment>
            <Card flow={3} p={0} py={6}>
              <Text>{formatBTC(totalBalance)}</Text>
              <Box ff="Open Sans" fontSize={4} color="warmGrey">
                <AreaChart
                  id="dashboard-chart"
                  margin={{
                    top: space[6],
                    bottom: 0,
                    left: space[6] - 10,
                    right: space[6],
                  }}
                  color="#5286f7"
                  height={250}
                  data={takeRight(
                    fakeDatas.reduce((res, data) => {
                      data.forEach((d, i) => {
                        res[i] = {
                          name: d.name,
                          value: (res[i] ? res[i].value : 0) + d.value,
                        }
                      })
                      return res
                    }, []),
                    25,
                  )}
                />
              </Box>
            </Card>
            <Box flow={4}>
              <Text color="dark" ff="Museo Sans" fontSize={6}>
                {'Accounts'}
              </Text>
              <Box flow={5}>
                {this.getAccountsChunk().map((accountsByLine, i) => (
                  <Box
                    key={i} // eslint-disable-line react/no-array-index-key
                    horizontal
                    flow={5}
                  >
                    {accountsByLine.map(
                      (account: any, j) =>
                        account === null ? (
                          <Box
                            key={j} // eslint-disable-line react/no-array-index-key
                            p={4}
                            flex={1}
                          />
                        ) : (
                          <AccountCard
                            key={account.id}
                            account={account}
                            data={takeRight(fakeDatas[j], 25)}
                            onClick={() => push(`/account/${account.id}`)}
                          />
                        ),
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Fragment>
        )}
      </Box>
    )
  }
}

export default compose(connect(mapStateToProps, mapDispatchToProps), translate())(DashboardPage)