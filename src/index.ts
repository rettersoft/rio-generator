import { Classes, Models, quickTypeJSONSchema, SupportedProgrammingLanguage } from './utils'
import { renderTypescript } from './languages/typescript'
import { renderKotlin } from './languages/kotlin'
import { renderSwift } from './languages/swift'

export async function generator(params: { classes: Classes; models: Models }, language: SupportedProgrammingLanguage = 'typescript'): Promise<string> {
    const { classes, models } = params
    const { lines } = await quickTypeJSONSchema('RioModels', JSON.stringify({ properties: { ...models }, $defs: { ...models } }), language)
    const interfaces = lines.join('\n')
    switch (language) {
        case 'kotlin-client':
            return renderKotlin(classes, interfaces)
        case 'swift-client':
            return renderSwift(classes, interfaces)
        case 'typescript':
        default:
            return renderTypescript(classes, interfaces)
    }
}
