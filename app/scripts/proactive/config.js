define(function (require) {
    return {
        restApiUrl: '/rest/studio',
        templates: {
            'Basic workflows': {
                "Script Task": 'templates/01_simple_task.xml',
                "Native Task (linux)": 'templates/04_native_task_linux.xml',
                "Native Task (windows)": 'templates/04_native_task_windows.xml',
                "Java Task": 'templates/java.xml',
                "Two tasks with dependency": 'templates/02_task_dependencies.xml',
                "Variable Propagation": 'templates/10_variable_propagation.xml',
                "Pre/Post/Clean Scripts": 'templates/12_pre_post_clean_scripts.xml',
                "Selection Scripts": 'templates/13_selection_script.xml',
                "Distributed PI computation": 'templates/03_java_tasks_PI.xml'
            },
            'Advanced workflows': {
                "Job with Data": 'templates/08_dataspaces.xml',
                "If / else branches": 'templates/07_workflow_branch.xml',
                "Replicate block": 'templates/05_workflow_replication.xml',
                "Loop block": 'templates/06_workflow_loop.xml',
                "Cron Job": 'templates/11_cron_task.xml'
            },
            'Multi-nodes workflows': {
                "Multi Nodes Job": 'templates/09_multinode_task.xml',
                "MPI Job": 'templates/09_multinode_mpi_task.xml'
            }
        }
    }
})
