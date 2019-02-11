import { renderers } from 'callsite-record';
import MESSAGE from './message';
import createStackFilter from '../create-stack-filter';
import { getCallsiteForMethod } from '../get-callsite';
import renderTemplate from '../../utils/render-template';

// Errors
export class GeneralError extends Error {
    constructor (...args) {
        super(renderTemplate(...args));
        Error.captureStackTrace(this, GeneralError);
    }
}

export class TestCompilationError extends Error {
    constructor (originalError) {
        super(renderTemplate(MESSAGE.cannotPrepareTestsDueToError, originalError.toString()));

        // NOTE: stack includes message as well.
        this.stack = renderTemplate(MESSAGE.cannotPrepareTestsDueToError, originalError.stack);
    }
}

export class APIError extends Error {
    constructor (methodName, template, ...args) {
        const rawMessage = renderTemplate(template, ...args);

        super(renderTemplate(MESSAGE.cannotPrepareTestsDueToError, rawMessage));

        // NOTE: `rawMessage` is used in error substitution if it occurs in test run.
        this.rawMessage  = rawMessage;
        this.callsite    = getCallsiteForMethod(methodName);

        // HACK: prototype properties don't work with built-in subclasses
        // (see: http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node)
        Object.defineProperty(this, 'stack', {
            get: () => APIError._createStack(this.message, this.callsite, renderers.noColor)
        });

        Object.defineProperty(this, 'coloredStack', {
            get: () => APIError._createStack(this.message, this.callsite, renderers.default)
        });
    }

    static _createStack (message, callsiteRecord, renderer) {
        return message +
               '\n\n' +
               callsiteRecord.renderSync({
                   renderer:    renderer,
                   stackFilter: createStackFilter(Error.stackTraceLimit)
               });
    }
}

export class ClientFunctionAPIError extends APIError {
    constructor (methodName, instantiationCallsiteName, template, ...args) {
        template = template.replace(/\{#instantiationCallsiteName\}/g, instantiationCallsiteName);

        super(methodName, template, ...args);
    }
}

const ERROR_SEPARATOR = '\n\n';

export class CompositeError extends Error {
    constructor (errors) {
        super(errors.map(({ message }) => message).join(ERROR_SEPARATOR));

        this.stack = errors.map(({ stack }) => stack).join(ERROR_SEPARATOR);
    }
}
