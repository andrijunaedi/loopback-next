// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/health
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {HealthChecker, HealthStatus, State} from '@cloudnative/health';
import {BindingScope, Constructor, inject, injectable} from '@loopback/core';
import {get, Response, RestBindings} from '@loopback/rest';
import {HealthBindings} from '../keys';
import {DEFAULT_HEALTH_OPTIONS, HealthOptions} from '../types';

/**
 * A factory function to create a controller class for health endpoints. This
 * makes it possible to customize decorations such as `@get` with a dynamic
 * path value not known at compile time.
 *
 * @param options - Options for health endpoints
 */
export function createHealthController(
  options: HealthOptions = DEFAULT_HEALTH_OPTIONS,
): Constructor<unknown> {
  /**
   * Controller for health endpoints
   */
  @injectable({scope: BindingScope.SINGLETON})
  class HealthController {
    constructor(
      @inject(HealthBindings.HEALTH_CHECKER)
      private healthChecker: HealthChecker,
    ) {}

    @get(options.healthPath, {
      responses: {},
      'x-visibility': 'undocumented',
    })
    async health(@inject(RestBindings.Http.RESPONSE) response: Response) {
      const status = await this.healthChecker.getStatus();
      return handleStatus(status, response);
    }

    @get(options.readyPath, {
      responses: {},
      'x-visibility': 'undocumented',
    })
    async ready(@inject(RestBindings.Http.RESPONSE) response: Response) {
      const status = await this.healthChecker.getReadinessStatus();
      return handleStatus(status, response);
    }

    @get(options.livePath, {
      responses: {},
      'x-visibility': 'undocumented',
    })
    async live(@inject(RestBindings.Http.RESPONSE) response: Response) {
      const status = await this.healthChecker.getLivenessStatus();
      return handleStatus(status, response);
    }
  }

  return HealthController;
}

/**
 * Create response for the given status
 * @param status - Health status
 * @param response - Http response
 */
function handleStatus(status: HealthStatus, response: Response) {
  let statusCode = 200;
  switch (status.status) {
    case State.STARTING:
      statusCode = 503;
      break;
    case State.UP:
      statusCode = 200;
      break;
    case State.DOWN:
      statusCode = 503;
      break;
    case State.STOPPING:
      statusCode = 503;
      break;
    case State.STOPPED:
      statusCode = 503;
      break;
  }
  response.status(statusCode).send(status);
  return response;
}
