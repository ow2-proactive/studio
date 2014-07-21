define(function (require) {
    return {
        restApiUrl: '/rest/rest/studio',
        templates: {
            'Basic blocks': {
                "Script Task": 'templates/sleep.xml',
                "Native Task": 'templates/native.xml',
                "Java Task": 'templates/java.xml',
                "Two tasks with dependency": 'templates/dependency.xml',
                "If / else block": 'templates/if.xml',
                "Replicate block": 'templates/replicate.xml',
                "Loop block": 'templates/loop.xml'
            },
            'Examples': {
                "Multi Nodes Job": 'templates/Job_MultiNodes.xml',
                "Topology selection": 'templates/Job_MultiNodes_topology.xml',
                "Distributed PI computation": 'templates/Job_PI.xml'
            }
        }
    }
})
