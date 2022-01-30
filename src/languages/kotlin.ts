import YAML from 'yaml'
import { capitalizeFirstLetter, Classes } from '../utils'

export function renderClass(classId: string, template: any) {
    template = YAML.parse(template)
    const methods: string[] = []
    for (const method of template.methods) {
        const methodName = method.method
        const kotlinDefault = 'Any? = null'
        const inputInterface = capitalizeFirstLetter(method.inputModel, kotlinDefault)
        const outputInterface = capitalizeFirstLetter(method.outputModel, 'Any')
        methods.push(
            `
fun ${methodName}(
    input: ${inputInterface}, options: RBSCallMethodOptions? = null,
    onSuccess: ((${outputInterface}?) -> Unit)? = null,
    onError: ((Throwable?) -> Unit)? = null
) {
    val newOptions = options ?: RBSCallMethodOptions(
        method = "${methodName}",
        body = input
    )

    _obj.call<${outputInterface}>(newOptions, onSuccess = {
        onSuccess?.invoke(it.body)
    }, onError = {
        onError?.invoke(it)
    })
}
        `.trim(),
        )
    }
    return `
class ${classId} private constructor(obj: RBSCloudObject) {
    var _obj: RBSCloudObject = obj

    companion object {
        fun getInstance(
            rbs: RBS, options: RBSGetCloudObjectOptions? = null, onSuccess: ((${classId}) -> Unit)? = null,
            onError: ((Throwable?) -> Unit)? = null
        ) {
            val newOptions = options ?: RBSGetCloudObjectOptions(
                classId = "${classId}"
            )

            rbs.getCloudObject(newOptions, onSuccess = {
                onSuccess?.invoke(${classId}(it))
            }, onError = {
                onError?.invoke(it)
            })
        }
    }

    ${methods.join('\n\n')}
}
    `.trim()
}

export function renderKotlin(classes: Classes, interfaces: string) {
    const blocks: any[] = Object.keys(classes).map((classId) => renderClass(classId, classes[classId]))
    return `
// This is an auto generated file!

// package io.retter.android.autogenerated

import com.rettermobile.rbs.RBS
import com.rettermobile.rbs.cloud.RBSCallMethodOptions
import com.rettermobile.rbs.cloud.RBSCloudObject
import com.rettermobile.rbs.cloud.RBSGetCloudObjectOptions

${interfaces.trim()}

namespace RioClasses {
    ${blocks.reduce((f, i) => {
        f = f + '\n\n' + i
        return f.trim()
    }, '')}
}
    `
}
