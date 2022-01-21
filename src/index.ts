import YAML from 'yaml'
import { quicktype, InputData, TypeScriptTargetLanguage, JSONSchemaInput, FetchingJSONSchemaStore } from 'quicktype-core'

async function quicktypeJSONSchema(typeName: string, jsonSchemaString: string) {
    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

    // We could add multiple schemas for multiple types,
    // but here we're just making one type from JSON schema.
    await schemaInput.addSource({ name: typeName, schema: jsonSchemaString })

    const inputData = new InputData()
    inputData.addInput(schemaInput)

    const ts = new TypeScriptTargetLanguage()
    const index = ts.optionDefinitions.findIndex(i => i.name === 'just-types')
    ts.optionDefinitions[index].defaultValue = true
    return await quicktype({
        inputData,
        lang: ts,
        allPropertiesOptional: false
    })
}

export async function generator(params: { classes: { [key: string]: string }; models: { [key: string]: any } }) {
    const { classes, models } = params
    const { lines } = await quicktypeJSONSchema('RioModels', JSON.stringify({ properties: { ...models }, $defs: { ...models } }))
    const ts = lines.join('\n') + '\n\n'

    const schemas = Object.keys(models).reduce((final: string[], modelName: string) => {
        final.push(`"${modelName}": ${JSON.stringify(models[modelName])}`)
        return final
    }, [])

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

${ts.trim()}

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

export const Schemas = {
    ${schemas.join(',\n')}
}
`
}

function capitalizeFirstLetter(str?: string) {
    if (!str || str === 'any') return 'any'
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function renderClass(classId: string, template: any) {
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
public async ${methodName}(body: ${capitalizeFirstLetter(method.inputModel)}, options?: RDKOptions): Promise<RetterResponse<${capitalizeFirstLetter(method.outputModel)}> | undefined> {
    return await this.rdk.methodCall({
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
    return `
/** ${template.description || classId + ' Class'} */
export class ${classId} {
    private readonly rdk: RDK
    private readonly lookupKey?: { name: string; value: string }
    public readonly instanceId?: string

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
        this.rdk = new RDK()
        if (args.length === 0 || args.length > 2) {
            throw new Error('Invalid number of arguments.');
        }
        if (args.length === 2) this.lookupKey = { name: args[0], value: args[1] }
        else this.instanceId = args[0]
    }

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
        if (result && 200 <= result.statusCode && result.statusCode < 300) return new ${classId}(result.body.instanceId)

        throw new Error(result?.body?.message || 'failed')
    }

    ${methods.join('\n\n')}
}
        `.trim()
}
