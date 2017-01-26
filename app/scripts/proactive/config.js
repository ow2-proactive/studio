/* global define */

define(function () {

    'use strict';
    
    return {
        restApiUrl: '/rest/studio',
        tasks: {
            'Linux Bash': 'templates/script_bash.xml',
            'Windows Cmd': 'templates/script_cmd.xml',
            'Docker': 'templates/script_docker_compose.xml',
            'Java': 'templates/java.xml',
            'Javascript': 'templates/script_javascript.xml',
            'Groovy': 'templates/script_groovy.xml',
            'Ruby': 'templates/script_ruby.xml',
            'Python': 'templates/script_python.xml',
            'Language R': 'templates/script_r.xml',
            'Cron': 'templates/script_cron.xml',
            'LDAP Query': 'templates/script_ldap_query.xml'
        },
        manuals: {
            'Email Notification' : 'templates/email.xml',
            'Web Notification' : 'templates/webnotification.xml',
            'Web Validation' : 'templates/web_validation.xml'
        },
        controls: {
            'If': 'templates/07_workflow_branch.xml',
            'Loop': 'templates/06_workflow_loop.xml',
            'Replicate': 'templates/05_workflow_replication.xml',
            'Task Dependencies': 'templates/02_task_dependencies.xml',
            'Submit Job No Wait': 'templates/SubmitJobNoWait.xml',
            'Submit Job And Wait': 'templates/SubmitJobAndWait.xml'
        }
    };
});
