/* global define */

define(function () {

    'use strict';

    var java_keywords = ['java', 'util', 'ArrayList', 'io', 'File', 'HashMap', 'HashSet', 'net', 'InetAddress', 'String', 'StringBuilder', 'Integer', 'Double', 'Boolean', 'Date', 'Random', 'Vector', 'Properties', 'Arrays', 'Long', 'Math', 'Runtime', 'System', 'Process', 'Thread', 'ProcessBuilder', 'Exception', 'Throwable', 'Object', 'Class', 'URI', 'URL', 'put', 'get',
        'equals', 'toString', 'size', 'length', 'parseInt', 'parseDouble', 'parseLong', 'org', 'objectweb', 'ow2', 'proactive', 'scripting', 'helper', 'selection', 'SelectionUtils', 'checkHostName', 'checkIp', 'checkOSName', 'checkJavaProperty',
        'checkOSVersion', 'checkFreeMemory', 'checkExec', 'checkFreeSpaceDiskAvailable', 'node', 'nodesource', 'api', 'PAActiveObject', 'getNode', 'getNodeInformation', 'getName', 'getURL', 'org.ow2.proactive.scripting.helper.selection.SelectionUtils', 'proactive.node.nodesource', 'org.objectweb.proactive.api.PAActiveObject'];

    return {
        restApiUrl: '/rest/studio',
        schedulerRestApiUrl: '/rest/scheduler',
        execution_scheduler_restApiUrl: '/job-planner/planned_jobs',
        docUrl: '/doc',
        tasks: {
            '1. OS Shells': {
                'Shell': 'templates/script_shell.xml',
                'Linux Bash': 'templates/script_bash.xml',
                'Windows Cmd': 'templates/script_cmd.xml',
                'PowerShell': 'templates/script_powershell.xml'
            },

            '2. Languages': {
                'Groovy': 'templates/script_groovy.xml',
                'Python': 'templates/script_cpython.xml',
                'Jython': 'templates/script_python.xml',
                'Java': 'templates/java.xml',
                'Javascript': 'templates/script_javascript.xml',
                'Ruby': 'templates/script_ruby.xml',
                'Perl': 'templates/script_perl.xml',
                'PHP': 'templates/script_php.xml',
                'R': 'templates/script_r.xml',
                'Scalaw': 'templates/script_scala.xml',
                'VBScript': 'templates/script_vbscript.xml'
            },

            '3. Containers': {
                'Docker_File': 'templates/script_docker_file.xml',
                'Kubernetes': 'templates/script_kubernetes.xml',
                'Docker_Compose': 'templates/script_docker_compose.xml'
            }
        },
        modes: {
            'shell': 'shell',
            'bash': 'shell',
            'cmd': 'text/plain',
            'kubernetes': 'yaml',
            'docker-compose': 'yaml',
            'dockerfile': 'text/x-dockerfile',
            'scalaw': 'text/x-scala',
            'groovy': 'groovy',
            'javascript': 'javascript',
            'python': 'python',
            'cpython': 'python',
            'ruby': 'ruby',
            'perl': 'perl',
            'php': 'php',
            'powershell': 'powershell',
            'r': 'text/x-rsrc',
            'vbscript': 'text/vbscript'
        },
        languages_available: {
            'Script/selection': [" ", "groovy", "python", "cpython", "javascript", "ruby", "powershell", "R", "scalaw"],
            'Script/environment': [" ", "groovy", "python", "cpython", "javascript", "ruby", "scalaw"],
            'Script/pre': [" ", "bash", "shell", "cmd", "powershell", "groovy", "python", "cpython", "javascript", "ruby", "R", "scalaw", "perl", "php", "vbscript", "dockerfile", "docker-compose", "kubernetes"],
            'Script/task': [" ", "bash", "shell", "cmd", "powershell", "groovy", "python", "cpython", "javascript", "ruby", "R", "scalaw", "perl", "php", "vbscript", "dockerfile", "docker-compose", "kubernetes"],
            'Script/post': [" ", "bash", "shell", "cmd", "powershell", "groovy", "python", "cpython", "javascript", "ruby", "R", "scalaw", "perl", "php", "vbscript", "dockerfile", "docker-compose", "kubernetes"],
            'Script/flow': [" ", "groovy", "python", "cpython", "javascript", "ruby", "powershell", "R", "scalaw"],
            'Script/clean': [" ", "bash", "shell", "cmd", "powershell", "groovy", "python", "cpython", "javascript", "ruby", "R", "scalaw", "perl", "php", "vbscript", "docker-compose", "kubernetes"]
        },
        // convert the file extension taken from a script url or the catalog to the name of the language as it appears in the drop-down list
        // R language must be kept uppercase in this structure (as it's the corresponding value appearing in the list)
        extensions_to_languages: {
            "sc": "scalaw",
            "scala": "scalaw",
            "groovy": "groovy",
            "js": "javascript",
            "cpy": "cpython",
            "py": "python",
            "rb": "ruby",
            "ps": "powershell",
            "r": "R",
            "bash": "bash",
            "sh": "shell",
            "bat": "cmd",
            "yaml": "kubernetes",
            "yml": "docker-compose",
            "dockerfile": "dockerfile",
            "pl": "perl",
            "vbs": "vbscript",
            "php": "php"
        },
        languages_to_extensions: {
            "scalaw": "scala",
            "groovy": "groovy",
            "javascript": "js",
            "python": "py",
            "cpython": "cpy",
            "ruby": "rb",
            "r": "r",
            "shell": "sh",
            "bash": "bash",
            "cmd": "bat",
            "kubernetes": "yaml",
            "docker-compose": "yml",
            "dockerfile": "dockerfile",
            "perl": "pl",
            "powershell": "ps",
            "vbscript": "vbs",
            "php": "php"
        },
        languages_content_type: {
            "scalaw": "text/x-scala",
            "groovy": "text/x-groovy",
            "javascript": "text/javascript",
            "python": "text/x-python",
            "cpython": "text/x-python",
            "ruby": "text/x-ruby",
            "r": "text/x-rsrc",
            "shell": "text/x-sh",
            "bash": "text/x-sh",
            "cmd": "text/x-sh",
            "kubernetes": "text/x-yaml",
            "docker-compose": "text/x-yaml",
            "dockerfile": "text/x-dockerfile",
            "perl": "text/x-perl",
            "powershell": "application/x-powershell",
            "vbscript": "text/vbscript",
            "php": "application/x-httpd-php"
        },
        keywords: {
            'shell': ['case', 'do', 'done', 'elif', 'else', 'esac', 'fi', 'for', 'function', 'if', 'in', 'select', 'then', 'time', 'until', 'while', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'mv', 'cp', 'rm', 'rmdir', 'chmod', 'ln', 'grep', 'ps', 'curl', 'wget', 'sed', 'awk', 'cut', 'chown', 'echo', 'cat', 'exit', 'kill', 'pwd', 'sudo', 'date', 'df', 'hostname', 'sleep', 'quota', 'uptime', 'zip', 'unzip', 'tar', 'find', 'locate', 'install', 'open', 'bzip2', 'apt-get', 'ftp', 'sftp', 'yum'],
            'bash': ['case', 'do', 'done', 'elif', 'else', 'esac', 'fi', 'for', 'function', 'if', 'in', 'select', 'then', 'time', 'until', 'while', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'mv', 'cp', 'rm', 'rmdir', 'chmod', 'ln', 'grep', 'ps', 'curl', 'wget', 'sed', 'awk', 'cut', 'chown', 'echo', 'cat', 'exit', 'kill', 'pwd', 'sudo', 'date', 'df', 'hostname', 'sleep', 'quota', 'uptime', 'zip', 'unzip', 'tar', 'find', 'locate', 'install', 'open', 'bzip2', 'apt-get', 'ftp', 'sftp', 'yum'],
            'cmd': ['Append', 'Attrib', 'Backup', 'Break', 'Call', 'Cd', 'Chcp', 'Chdir', 'Choice', 'Cls', 'Command', 'Copy', 'Ctty', 'Date', 'Debug', 'Del', 'Deltree', 'Dir', 'Doskey', 'Echo', 'Erase', 'Exit', 'Expand', 'Fasthelp', 'Fastopen', 'Fc', 'Fdisk', 'Find', 'For', 'Format', 'Goto', 'Graphics', 'Help', 'If', 'Interlnk', 'Intersvr', 'Keyb', 'Label', 'Lh', 'Loadfix', 'Loadhigh', 'Md', 'Mem', 'Mkdir', 'Mode', 'More', 'Move', 'Nlsfunc', 'Path', 'Pause', 'Power', 'Print', 'Prompt', 'Rd', 'Rem', 'Ren', 'Rename', 'Replace', 'Restore', 'Rmdir', 'Scandisk', 'Set', 'Setver', 'Share', 'Shift', 'Smartdrv', 'Sort', 'Subst', 'Sys', 'Time', 'Tree', 'Type', 'Undelete', 'Unformat', 'Ver', 'Verify', 'Vol', 'Xcopy'],
            'kubernetes': ['apiVersion', 'kind', 'metadata', 'name', 'namespace', 'labels', 'data', 'spec', 'ports', 'port', 'targetPort', 'protocol', 'selector', 'type', 'externalIPs', 'replicas', 'template', 'containers', 'image', 'resources', 'limits', 'requests', 'cpu', 'memory', 'env', 'value', 'volumeMounts', 'mountPath', 'subPath', 'containerPort', 'readinessProbe', 'httpGet', 'path', 'initialDelaysSeconds', 'periodSeconds', 'timeoutSeconds', 'livenessProbe', 'exec', 'command', 'failureThreshold', 'lifecycle', 'postStart', 'preStop', 'args', 'volumes', 'azureFile', 'awsElasticBlockStore', 'azureDisk', 'gcePersistentDisk', 'gitRepo', 'emptyDir', 'persistentVolumeClaim', 'hostPath', 'secret', 'secretName', 'shareName', 'configMap', 'Deployment', 'Service', 'ConfigMap', 'Job', 'Ingress', 'CronJob', 'Pod', 'schedule', 'DaemonSet', 'annotations', 'labels', 'valueFrom', 'fieldRef', 'fieldPath', 'tls', 'backend'],
            'docker-compose': ['version', 'services', 'build', 'context', 'dockerfile', 'args', 'cache_from', 'labels', 'shm_size', 'target', 'cap_add', 'cap_drop', 'command', 'configs', 'source', 'uid', 'gid', 'mode', 'cgroup_parent', 'container_name', 'credential_spec', 'deploy', 'endpoint_mode', 'labels', 'placement', 'constraints', 'preferences', 'replicas', 'resources', 'restart_policy', 'condition', 'delay', 'max_attempts', 'window', 'update_config', 'devices', 'depends_on', 'dns', 'dns_search', 'tmpfs', 'entrypoint', 'env_file', 'environment', 'expose', 'external_links', 'extra_hosts', 'healthcheck', 'image', 'links', 'logging', 'network_mode', 'networks', 'aliases', 'ipv4_address', 'ipv6_address', 'pid', 'ports', 'secrets', 'security_opt', 'stop_grace_period', 'stop_signal', 'sysctls', 'ulimits', 'userns_mode', 'volumes', 'restart', 'driver', 'driver_opts', 'external', 'name'],
            'scalaw': ['case', 'catch', 'class', 'def', 'do', 'else', 'extends', 'false', 'final', 'for', 'if', 'match', 'new', 'null', 'print', 'printf', 'println', 'throw', 'to', 'trait', 'true', 'try', 'until', 'val', 'var', 'while', 'with', 'Array', 'Console', 'Int', 'List', 'Map', 'None', 'Option', 'Ordering', 'Range', 'Regex', 'Set', 'StdIn'].concat(java_keywords),
            'groovy': ['as', 'assert', 'break', 'case', 'catch', 'class', 'const', 'continue', 'def', 'default', 'do', 'else', 'enum', 'extends', 'false', 'finally', 'for', 'goto', 'if', 'implement', 'import', 'in', 'instanceof', 'interface', 'new', 'null', 'package', 'return', 'super', 'switch', 'this', 'throw', 'throws', 'trait', 'true', 'try', 'while', 'println'].concat(java_keywords),
            'javascript': ['case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'and', 'with'].concat(java_keywords),
            'python': ['False', 'class', 'finally', 'is', 'return', 'None', 'continue', 'for', 'lambda', 'try', 'True', 'def', 'from', 'nonlocal', 'while', 'and', 'del', 'global', 'not', 'with', 'as', 'elif', 'if', 'or', 'yield', 'assert', 'else', 'import', 'pass', 'break', 'except', 'in', 'raise'].concat(java_keywords),
            'cpython': ['False', 'class', 'finally', 'is', 'return', 'None', 'continue', 'for', 'lambda', 'try', 'True', 'def', 'from', 'nonlocal', 'while', 'and', 'del', 'global', 'not', 'with', 'as', 'elif', 'if', 'or', 'yield', 'assert', 'else', 'import', 'pass', 'break', 'except', 'in', 'raise'],
            'ruby': ['__ENCODING__', '__LINE__', '__FILE__', 'BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'new', 'nil', 'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when', 'while', 'yield', 'puts', 'EOF', 'initialize', 'each', 'print', 'Array', 'Hash', 'Time', 'Dir', 'to_s', 'to_i', 'to_java', 'from_java'].concat(java_keywords),
            'perl': ['print', 'die', 'split', 'while', 'foreach', 'if', 'else', 'elseif', 'open', 'close', 'sleep', 'exit', 'mkdir', 'rename', 'chmod'],
            'powershell': ['Begin', 'Break', 'Catch', 'Class', 'Continue', 'Data', 'Define', 'Do', 'DynamicParam', 'Else', 'Elseif', 'End', 'Enum', 'Exit', 'Filter', 'Finally', 'For', 'ForEach', 'From', 'Function', 'Hidden', 'If', 'In', 'Param', 'Process', 'Return', 'Static', 'Switch', 'Throw', 'Trap', 'Try', 'Until', 'Using', 'Var', 'While', 'ForEach-Object', 'Where-Object', 'Add-Content', 'Add-PSSnapIn', 'Get-Content', 'Set-Location', 'Clear-Content', 'Clear-Host', 'Clear-History', 'Clear-Item', 'Clear-ItemProperty', 'Clear-Variable', 'Connect-PSSession', 'Compare-Object', 'Copy-Item', 'Copy-ItemProperty', 'Invoke-WebRequest', 'Convert-Path', 'Disable-PSBreakpoint', 'Remove-Item', 'Get-ChildItem', 'Disconnect-PSSession', 'Enable-PSBreakpoint', 'Write-Host', 'Write-Output', 'Export-Alias', 'Export-Csv', 'Export-PSSession', 'Enter-PSSession', 'Exit-PSSession', 'Format-Custom', 'Format-List', 'ForEach-Object', 'Format-Table', 'Format-Wide', 'Get-Alias', 'Get-PSBreakpoint', 'Get-Content', 'Get-ChildItem', 'Get-Command', 'Get-PSCallStack', 'Get-PSDrive', 'Get-History', 'Get-Item', 'Get-Job', 'Get-Location', 'Get-Member', 'Get-Module', 'Get-ItemProperty', 'Get-Process', 'Group-Object', 'Get-PSSession', 'Get-PSSnapIn', 'Get-Service', 'Get-Unique', 'Get-Variable', 'Get-WmiObject', 'Get-History', 'Invoke-Command', 'Invoke-Expression', 'Invoke-History', 'Invoke-Item', 'Import-Alias', 'Import-Csv', 'Import-Module', 'Import-PSSession', 'Invoke-History', 'Invoke-RestMethod', 'Invoke-WMIMethod', 'Invoke-WebRequest', 'Stop-Process', 'Out-Printer', 'Get-ChildItem', 'help', 'mkdir', 'Measure-Object', 'Move-Item', 'New-PSDrive', 'Move-ItemProperty', 'New-Alias', 'New-Item', 'New-Module', 'New-PSSessionConfigurationFile', 'New-PSSession', 'New-Variable', 'Out-GridView', 'Out-Host', 'Pop-Location', 'Push-Location', 'Receive-Job', 'Receive-PSSession', 'Remove-Item', 'Remove-PSDrive', 'Remove-Job', 'Remove-Module', 'Remove-ItemProperty', 'Remove-PSBreakpoint', 'Remove-PSSession', 'Remove-PSSnapin', 'Remove-Variable', 'Remove-WMIObject', 'Rename-Item', 'Rename-ItemProperty', 'Resume-Job', 'Resolve-Path', 'Set-Alias', 'Set-PSBreakpoint', 'Set-Content', 'Select-Object', 'Set-Variable', 'Set-Item', 'Show-Command', 'Start-Job', 'Start-Process', 'Start-Service'],
            'R': ['if', 'else', 'repeat', 'while', 'function', 'for', 'in', 'next', 'break', 'TRUE', 'FALSE', 'NULL', 'Inf', 'NaN', 'NA', 'cbind', 'subset', 'beta', 'gamma', 'choose', 'factorial', 'dnorm', 'pnorm', 'qnorm', 'rnorm', 'replace', 'scrub', 'cut', 'round', 'ceiling', 'floor', 'as.integer', 'as.matrix', 'factor', 'transform', 'all', 'any', 'max', 'min', 'mean', 'median', 'sum', 'var', 'table', 'rev', 'print', 'apply', 'colSums', 'rowSums', 'rowsum', 'colMeans', 'rowMeans', 'rnorm'],
            'vbscript': ['And', 'As', 'Boolean', 'ByRef', 'Byte', 'ByVal', 'Call', 'Case', 'Class', 'Const', 'CreateObject', 'Currency', 'Debug', 'Dim', 'Do', 'Double', 'Each', 'Echo', 'Else', 'ElseIf', 'Empty', 'End', 'EndIf', 'Enum', 'Environment', 'Eqv', 'Event', 'Exit', 'False', 'For', 'Function', 'Get', 'GoTo', 'If', 'Imp', 'Implements', 'In', 'Integer', 'Is', 'Let', 'Like', 'Long', 'Loop', 'LSet', 'Me', 'Mod', 'New', 'Next', 'Not', 'Nothing', 'Null', 'On', 'Option', 'Optional', 'Or', 'ParamArray', 'Preserve', 'Private', 'Public', 'RaiseEvent', 'ReDim', 'Rem', 'Resume', 'RSet', 'Select', 'Set', 'Shared', 'Shell', 'Single', 'Static', 'Stop', 'Sub', 'Then', 'To', 'True', 'Type', 'TypeOf', 'Until', 'Variant', 'Wend', 'While', 'With', 'WScript', 'Xor'],
            'php': ['abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final', 'finally', 'for', 'foreach', 'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 'list', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public','require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'yield', '__CLASS__', '__DIR__', '__FILE__', '__FUNCTION__', '__LINE__', '__METHOD__', '__NAMESPACE__', '__TRAIT__']
        },
        dictionary: ['variables', 'nodesurl', 'genericInformation', 'localspace', 'cachespace', 'inputspace', 'outputspace',
            'globalspace', 'userspace', 'globalspaceapi', 'userspaceapi', 'forkEnvironment', 'schedulerapi', 'synchronizationapi',
            'result', 'results', 'resultMetadata', 'credentials', 'branch', 'runs', 'loop', 'selected', 'nodeurl', 'nodename', 'nodehost',
            'PA_JOB_ID', 'PA_JOB_NAME', 'PA_TASK_ID', 'PA_TASK_NAME', 'PA_TASK_ITERATION', 'PA_TASK_REPLICATION',
            'PA_TASK_SUCCESS', 'PA_SCHEDULER_HOME', 'PA_SCHEDULER_REST_URL', 'PA_TASK_PROGRESS_FILE', 'PA_NODESFILE', 'PA_NODESNUMBER', 'PA_CATALOG_REST_URL', 'PA_USER',
            'PA_NODE_URL', 'PA_NODE_NAME', 'PA_NODE_HOST'
        ],
        default_preset: 0,
        palette_presets: [
            {
                'name': 'Basic Examples',
                'buckets': ['controls', 'notification-tools', 'basic-examples']
            },
            {
                'name': 'Machine Learning',
                'buckets': ['controls', 'notification-tools', 'basic-examples', 'machine-learning', 'machine-learning-workflows', 'data-visualization', 'auto-ml-optimization', 'model-as-a-service']
            },
            {
                'name': 'Deep Learning',
                'buckets': ['controls', 'notification-tools', 'basic-examples', 'deep-learning', 'deep-learning-workflows', 'data-visualization', 'auto-ml-optimization', 'azure-cognitive-services']
            },
            {
                'name': 'Big Data',
                'buckets': ['controls', 'notification-tools', 'basic-examples', 'big-data', 'data-connectors', 'database-services']
            }
        ],
        docker_env_script: `
// This script creates a docker fork environment using java as docker image

// If used on windows:
//  - currently, only linux containers are supported
//  - make sure the drives containing the scheduler installation and TEMP folders are shared with docker containers
//  - the container used must have java installed by default in the /usr folder. Change the value of the java home parameter to use a different installation path
// On linux, the java installation used by the ProActive Node will be also used inside the container

// Prepare Docker parameters
import org.ow2.proactive.utils.OperatingSystem;
import org.ow2.proactive.utils.OperatingSystemFamily;

containerName = "java"
cmd = []
cmd.add("docker")
cmd.add("run")
cmd.add("--rm")
cmd.add("--env")
cmd.add("HOME=/tmp")

String osName = System.getProperty("os.name");
println "Operating system : " + osName;
OperatingSystem operatingSystem = OperatingSystem.resolveOrError(osName);
OperatingSystemFamily family = operatingSystem.getFamily();

switch (family) {
    case OperatingSystemFamily.WINDOWS:
        isWindows = true;
        break;
    default:
        isWindows = false;
}
forkEnvironment.setDockerWindowsToLinux(isWindows)

// Prepare ProActive home volume
paHomeHost = variables.get("PA_SCHEDULER_HOME")
paHomeContainer = (isWindows ? forkEnvironment.convertToLinuxPath(paHomeHost) : paHomeHost)
cmd.add("-v")
cmd.add(paHomeHost + ":" + paHomeContainer)
// Prepare working directory (For Dataspaces and serialized task file)
workspaceHost = localspace
workspaceContainer = (isWindows ? forkEnvironment.convertToLinuxPath(workspaceHost) : workspaceHost)
cmd.add("-v")
cmd.add(workspaceHost + ":" + workspaceContainer)

cachespaceHost = cachespace
cachespaceContainer = (isWindows ? forkEnvironment.convertToLinuxPath(cachespaceHost) : cachespaceHost)
cachespaceHostFile = new File(cachespaceHost)
if (cachespaceHostFile.exists() && cachespaceHostFile.canRead()) {
    cmd.add("-v")
    cmd.add(cachespaceHost + ":" + cachespaceContainer)
} else {
    println cachespaceHost + " does not exist or is not readable, access to cache space will be disabled in the container"
}

if (!isWindows) {
    // when not on windows, mount and use the current JRE
    currentJavaHome = System.getProperty("java.home")
    forkEnvironment.setJavaHome(currentJavaHome)
    cmd.add("-v")
    cmd.add(currentJavaHome + ":" + currentJavaHome)
}

// Prepare container working directory
cmd.add("-w")
cmd.add(workspaceContainer)

if (isWindows) {
    // linux on windows does not allow sharing identities (such as AD identities)
} else {
    sigar = new org.hyperic.sigar.Sigar()
    try {
        pid = sigar.getPid()
        creds = sigar.getProcCred(pid)
        uid = creds.getUid()
        gid = creds.getGid()
        cmd.add("--user=" + uid + ":" + gid)
    } catch (Exception e) {
        println "Cannot retrieve user or group id : " + e.getMessage()
    } finally {
        sigar.close()
    }
}
cmd.add(containerName)

forkEnvironment.setPreJavaCommand(cmd)

// Show the generated command
println "DOCKER COMMAND : " + forkEnvironment.getPreJavaCommand()
        `
    };
});
