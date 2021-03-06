import YAML from 'yaml'
import { capitalizeFirstLetter, Classes } from '../../utils'

export function renderClass(classId: string, template: any) {
    template = YAML.parse(template)
    const methods: string[] = []
    for (const method of template.methods) {
        const methodName = method.method
        const inputInterface = capitalizeFirstLetter(method.inputModel, 'any')
        const outputInterface = capitalizeFirstLetter(method.outputModel, 'any')
        methods.push(
            `
    async ${methodName}(input?: ${inputInterface}, options?: Omit<RetterCloudObjectCall, 'method' | 'body'>): Promise<${outputInterface}> {
        return this._obj.call({ ...options, method: "${methodName}", body: input }).then(r => r.data as ${outputInterface})
    }
        `.trim(),
        )
    }
    return `
export class ${classId} {
    public readonly _obj: RetterCloudObject

    private constructor(obj: RetterCloudObject) {
        this._obj = obj
    }

    static async getInstance(rio: Retter, options?: Omit<RetterCloudObjectConfig, 'classId'>): Promise<${classId}> {
        const params = { ...options, classId: '${classId}' }
        if (params.instanceId && params['useLocal'] !== false) params['useLocal'] = true
        return new ${classId}(await rio.getCloudObject(params))
    }

    ${methods.join('\n\n')}
}
        `.trim()
}

export function renderTypescript(classes: Classes, interfaces: string, arrayModels: string) {
    const blocks: any[] = Object.keys(classes).map((classId) => renderClass(classId, classes[classId]))
    return `
// This is an auto generated file!

import Retter, { RetterCloudObject, RetterCloudObjectCall, RetterCloudObjectConfig } from '@retter/sdk'

${interfaces.trim()}

${arrayModels.trim()}

export namespace RioClasses {
    ${blocks.reduce((f, i) => {
        f = f + '\n\n' + i
        return f.trim()
    }, '')}
}
    `
}
