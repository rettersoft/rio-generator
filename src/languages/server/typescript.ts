import YAML from 'yaml'
import { capitalizeFirstLetter, Classes } from '../../utils'

export function renderClass(classId: string, template: any) {
    template = YAML.parse(template)
    const methods: string[] = []
    for (const method of template.methods) {
        const methodName = method.method
        const description = method.description || 'calls ' + methodName + ' on ' + classId
        methods.push(
            `
/**
 * ${description}
 * @param {${capitalizeFirstLetter(method.inputModel)}} body - payload
 * @param {RDKOptions} options - other method call parameters
 * @returns {Promise<RetterResponse<${capitalizeFirstLetter(method.outputModel)}>>}
 */
public async ${methodName}(body?: ${capitalizeFirstLetter(method.inputModel)}, options?: RDKOptions): Promise<RetterResponse<${capitalizeFirstLetter(method.outputModel)}> | undefined> {
    return await this._rdk.methodCall({
        ...options,
        classId: '${classId}',
        instanceId: this.instanceId,
        lookupKey: this.lookupKey,
        methodName: '${methodName}',
        body,
    })
}
        `.trim(),
        )
    }
    const getInstanceInputType = template.init && typeof template.init !== 'string' ? template.init.inputModel : 'any'
    const getInstanceOutputTypeA = template.init && typeof template.init !== 'string' ? template.init.outputModel : undefined
    const getInstanceOutputTypeB = template.get && typeof template.get !== 'string' ? template.get.outputModel : undefined
    const getInstanceOutputType = getInstanceOutputTypeA || getInstanceOutputTypeB || 'any'
    return `
/** ${template.description || classId + ' Class'} */
export class ${classId} {
    private readonly _rdk: RDK
    private readonly lookupKey?: { name: string; value: string }
    public readonly instanceId?: string
    public isNewInstance?: boolean
    public _response?: ${getInstanceOutputType}

    /**
     * use this constructor if you know the instance id.
     * @param {string} instanceId - instance id
     * @returns {${classId}}
     */
    public constructor(instanceId: string);
    /**
     * use this constructor if you know only the look up key.
     * @param {string} name - look up key name
     * @param {string} value - look up key value
     * @returns {${classId}}
     */
    public constructor(name: string, value: string);
    public constructor(...args: string[]) {
        this.isNewInstance = false
        this._rdk = new RDK()
        if (args.length === 0 || args.length > 2) {
            throw new Error('Invalid number of arguments.');
        }
        if (args.length === 2) this.lookupKey = { name: args[0], value: args[1] }
        else this.instanceId = args[0]
    }

    get rdk() { return this._rdk }

    /**
     * Gets a cloud object instance or creates new one
     * @param {RetterRequest<${capitalizeFirstLetter(getInstanceInputType)}>} options - instance options
     * @returns {Promise<${classId}>}
     */
    public static async getInstance(options?: RetterRequest<${capitalizeFirstLetter(getInstanceInputType)}>): Promise<${classId}> {
        const rdk = new RDK()
        const result = await rdk.getInstance({
            ...options,
            classId: '${classId}',
        })
        if (result && 200 <= result.statusCode && result.statusCode < 300) {
            const _instance = new ${classId}(result.body.instanceId)
            _instance.isNewInstance = !!result.body.newInstance
            _instance._response = result.body.response
            return _instance
        }

        throw new Error(result?.body?.message || 'failed')
    }

    ${methods.join('\n\n')}
}
        `.trim()
}

export function renderTypescript(classes: Classes, interfaces: string) {
    const blocks: any[] = Object.keys(classes).map((classId) => renderClass(classId, classes[classId]))
    return `
// This is an auto generated file!

import RDK, { KeyValueString, GetInstance, CloudObjectResponse } from '@retter/rdk'

interface RetterRequest<T> extends Omit<GetInstance, 'classId'|'body'> {
    body?: T
}

interface RetterResponse<T> extends CloudObjectResponse {
    body?: T
}

${interfaces.trim()}

export interface RDKOptions {
    httpMethod?: string
    queryStringParams?: KeyValueString
    headers?: KeyValueString
}

export namespace Classes {
    ${blocks.reduce((f, i) => {
        f = f + '\n\n' + i
        return f.trim()
    }, '')}
}
`
}