import YAML from 'yaml'
import { compile } from 'json-schema-to-typescript'

export async function generator(params: { classes: { [key: string]: string }, models: { [key: string]: any } }) {
    const { classes, models } = params
    const jsonSchema = JSON.parse(JSON.stringify({ $defs: { ...models } }))
    const ts = await compile(jsonSchema as any, 'ProjectSchema', {
        enableConstEnums: true,
        unreachableDefinitions: true,
        strictIndexSignatures: false
    })

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

${ts}

export interface RDKOptions {
    httpMethod?: string
    queryStringParams?: KeyValueString
    headers?: KeyValueString
}

${blocks.reduce((f, i) => {
    f = f + '\n\n' + i;
    return f.trim()
}, '')}
    `.trim()
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
        methods.push(`
public async ${methodName}(body: ${capitalizeFirstLetter(method.inputModel)}, options?: RDKOptions): Promise<RetterResponse<${capitalizeFirstLetter(method.outputModel)}>> {
    return await this.rdk.methodCall({
        ...options,
        classId: '${classId}',
        instanceId: this.instanceId,
        lookupKey: this.lookupKey,
        methodName: '${methodName}',
        body,
    })
}
        `.trim())
    }
    const getInstanceInputType = template.init && typeof template.init !== 'string' ? template.init.inputModel : 'any'
    return `
export class ${classId} {
    private readonly rdk: RDK
    private readonly instanceId?: string
    private readonly lookupKey?: { name: string; value: string }

    public constructor(instanceId: string);
    public constructor(name: string, value: string);
    public constructor(...args: string[]) {
        this.rdk = new RDK()
        if (args.length === 0 || args.length > 2) {
            throw new Error('Invalid number of arguments.');
        }
        if (args.length === 2) this.lookupKey = { name: args[0], value: args[1] }
        else this.instanceId = args[0]
    }

    public static async getInstance(options?: RetterRequest<${capitalizeFirstLetter(getInstanceInputType)}>): Promise<${classId}> {
        const rdk = new RDK()
        const result = await rdk.getInstance({
            ...options,
            classId: '${classId}',
        })
        return new ${classId}(result.body.instanceId)
    }

    ${ methods.join('\n\n') }
}
        `.trim()
}
