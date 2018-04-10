//Make sure that babel-polyfill is only required in once
if (!global._babelPolyfill && !window._babelPolyfill) { 
    require("babel-polyfill");
}

import React, {Component} from 'react';
import { setInterval } from 'timers';

export default class HealthCheck extends Component {
  constructor(props) {
      super(props);

      /**
       * Prop List
       * - endpoints -> Object[]
       * --- {
       *        url: String 
       *        resourceName: String
       *        mayReceiveWarnings: Boolean
       *     }
       * - interval  -> Number represented in milliseconds
       */

       this.state = {
            areStatusesVisible: false,
            healthCheckResults: [],
       }
       this.interval = null;

       this.containerStyle = {

       }

       this.overallStatusViewStyle = {
            width: "30px", 
            height: "30px", 
            borderRadius: "50%"
       }

       this.detailedStatusViewStyle = {
            width: "25px",
            height: "25px",
            marginLeft: "auto",
            marginRight: "auto"
       }
  }

  componentDidMount() {
      const {interval} = this.props;
      this.interval = setInterval(this.conductHealthChecks, interval);
  }

  determineStatusColor = (didResourceGetResponse, resourceWarningsAndErrors) => {
      const {errors, warnings} = resourceWarningsAndErrors;
      if(!didResourceGetResponse || errors) {
          return "red";
      } else if (warnings) {
          return "yellow";
      } else {
          return "green";
      }
  }

  determineOverallStatusColor = () => {
    const statusColors = this.state.healthCheckResults.map(healthCheckResult => healthCheckResult.statusColor);
    if(statusColors.includes("red")) return "red";
    if(statusColors.includes("yellow")) return "yellow";
    return "green";
  }

  determineResourceErrorsAndWarnings = async (response) => {
      let output = {errors: null, warnings: null};
      try {
        const responseJSON = await response.json(); 
        if(responseJSON.length > 0) {
            const objectsWithWarnings = responseJSON.filter(obj => obj.warning);
            const objectsWithErrors = responseJSON.filter(obj => obj.error);
            output = {
                errors: objectsWithErrors.length > 0 ? objectsWithErrors.map(obj => obj.error) : null,
                warnings: objectsWithWarnings.length > 0 ? objectsWithWarnings.map(obj => obj.warning) : null 
            }
        }
    } catch(e) {
        console.log("React Health Check -> ", e.message);
    } finally {
        return output;
    }
  }

  conductHealthChecks = async () => {
        let healthCheckResultPromises = this.props.endpoints.map(async (endpointConfig) => {
            let output;
            try {
                let response = await fetch(endpointConfig.url);
                let resourceWarningsAndErrors = response.json && endpointConfig.mayReceiveWarningsAndErrors ? await this.determineResourceErrorsAndWarnings(response) : {warnings: null, errors: null};
                let {warnings, errors} = resourceWarningsAndErrors;
                output = {
                    ...endpointConfig,
                    statusColor: this.determineStatusColor(response.ok, resourceWarningsAndErrors),
                    lastResponse: new Date(Date.now()).toISOString(),
                    warnings,
                    errors
                };
            } catch(e) {
                output = {...endpointConfig, errors: [e.message]};
            } finally {
                return output;
            }
        });

        let healthCheckResults = await Promise.all(healthCheckResultPromises);
        this.setState({healthCheckResults});
  }

  showStatuses = () => {
        this.setState(state => {
            return {
                areStatusesVisible: !state.areStatusesVisible 
            }
        });
    }

  render() {
    const {areStatusesVisible, healthCheckResults} = this.state;
    const overallStatusColor = this.determineOverallStatusColor();
    return (
        <div className="rhc-cntr" > 
            <div className="rhc-overall-status-view" style={{...this.overallStatusViewStyle, backgroundColor: overallStatusColor}} onClick={this.showStatuses}></div>
            {areStatusesVisible && 
            <div className="rhc-detailed-status-view">
                <table>
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Status</th>
                            <th>Errors</th>
                            <th>Warnings</th>
                            <th>Last Response</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {healthCheckResults.map(healthCheckResult => {
                        return (
                                <tr key={healthCheckResult.resourceName}>
                                    <td>{healthCheckResult.resourceName}</td>
                                    <td><div className="rhc-status-block" style={{...this.detailedStatusViewStyle, backgroundColor: healthCheckResult.statusColor}}></div></td>
                                    <td>{healthCheckResult.errors && healthCheckResult.errors.length > 0 ? healthCheckResult.errors.pop() : ""}</td>
                                    <td>{healthCheckResult.warnings && healthCheckResult.warnings.length > 0 ? healthCheckResult.warnings.pop() : ""}</td>
                                    <td>{healthCheckResult.lastResponse || "Conducting First Check..."}</td>
                                </tr>
                        )                           
                        })}
                    </tbody>
                </table>
            </div>
            }
        </div>
    )
  }
}