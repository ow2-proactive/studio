define(function (require) {
    return {
        restApiUrl: '/rest/studio',
        tasks: {
            "Bash": 'templates/script_bash.xml',
            "Cmd": 'templates/script_cmd.xml',
            "Groovy": 'templates/script_groovy.xml',
            "Java": 'templates/java.xml',
            "Javascript": 'templates/script_javascript.xml',
            "Native": 'templates/04_native_task.xml',
            "Python": 'templates/script_python.xml',
            "Ruby": 'templates/script_ruby.xml',
            "R": 'templates/script_r.xml'
        },
        controls: {
            "If": 'templates/07_workflow_branch.xml',
            "Loop": 'templates/06_workflow_loop.xml',
            "Replicate": 'templates/05_workflow_replication.xml',
            "Task Dependencies": 'templates/02_task_dependencies.xml'
        }
    }
})
