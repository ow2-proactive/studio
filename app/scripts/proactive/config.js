define(function (require) {
    return {
        restApiUrl: '/rest/studio',
        tasks: {
            "Native Linux": 'templates/04_native_task_linux.xml',
            "Native Windows": 'templates/04_native_task_windows.xml',
            "Java": 'templates/java.xml',
            "Javascript": 'templates/script_javascript.xml',
            "Groovy": 'templatestys/script_groovy.xml',
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
        },
        templates: {
            'Basic Workflows': {
                "Pre/Post/Clean Scripts": 'templates/12_pre_post_clean_scripts.xml',
                "Selection Scripts": 'templates/13_selection_script.xml',
                "Variable Propagation": 'templates/10_variable_propagation.xml',
                "Distributed Computation (Pi)": 'templates/03_java_tasks_PI.xml'
            },
            'Advanced Workflows': {
                "Data Management": 'templates/08_dataspaces.xml',
                "Cron Job": 'templates/11_cron_task.xml',
                "Multi-Nodes Task": 'templates/09_multinode_task.xml',
                "MPI Job": 'templates/09_multinode_mpi_task.xml',
                "Cloud Automation": 'templates/cloud_automation.xml'
            }
        }
    }
})
