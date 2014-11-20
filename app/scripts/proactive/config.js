define(function (require) {
    return {
        restApiUrl: '/rest/studio',
        tasks: {
            "Native Linux": 'templates/04_native_task_linux.xml',
            "Native Windows": 'templates/04_native_task_windows.xml',
            "Java": 'templates/java.xml',
            "Javascript": 'templates/script_javascript.xml',
            "Groovy": 'templates/script_groovy.xml',
            "Ruby": 'templates/script_ruby.xml',
            "Python": 'templates/script_python.xml',
            "Bash": 'templates/script_bash.xml',
            "Cmd": 'templates/script_cmd.xml',
            "Language R": 'templates/script_r.xml'
        },
        controls: {
            "Task Dependencies": 'templates/02_task_dependencies.xml',
            "If": 'templates/07_workflow_branch.xml',
            "Loop": 'templates/06_workflow_loop.xml',
            "Replicate": 'templates/05_workflow_replication.xml'
        }
    }
})
