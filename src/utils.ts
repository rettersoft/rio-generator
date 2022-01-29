import { quicktype, InputData, JSONSchemaInput, FetchingJSONSchemaStore } from 'quicktype-core'

// * supported programming languages
import { KotlinTargetLanguage } from 'quicktype-core'
import { SwiftTargetLanguage } from 'quicktype-core'
import { TargetLanguage } from 'quicktype-core'
import { TypeScriptTargetLanguage } from 'quicktype-core'

export type SupportedProgrammingLanguage = 'typescript' | 'swift' | 'kotlin'
export type Classes = { [key: string]: string }
export type Models = { [key: string]: any }

export function capitalizeFirstLetter(str?: string, _default = 'any') {
    if (!str || str === _default) return _default
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export async function quickTypeJSONSchema(typeName: string, jsonSchemaString: string, language: SupportedProgrammingLanguage) {
    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

    await schemaInput.addSource({ name: typeName, schema: jsonSchemaString })

    const inputData = new InputData()
    inputData.addInput(schemaInput)

    let targetLanguage: TargetLanguage

    switch (language) {
        case 'kotlin':
            targetLanguage = new KotlinTargetLanguage()
            break;
        case 'swift':
            targetLanguage = new SwiftTargetLanguage()
            break;
        case 'typescript':
        default:
            targetLanguage = new TypeScriptTargetLanguage()
            break;
    }

    let index = targetLanguage.optionDefinitions.findIndex(i => i.name === 'just-types')
    if (index !== -1) targetLanguage.optionDefinitions[index].defaultValue = true
    index = targetLanguage.optionDefinitions.findIndex(i => i.name === 'mutable-properties')
    if (index !== -1) targetLanguage.optionDefinitions[index].defaultValue = true
    index = targetLanguage.optionDefinitions.findIndex(i => i.name === 'protocol')
    if (index !== -1) targetLanguage.optionDefinitions[index].defaultValue = 'equatable'
    return await quicktype({
        inputData,
        lang: targetLanguage,
        allPropertiesOptional: false
    })
}
