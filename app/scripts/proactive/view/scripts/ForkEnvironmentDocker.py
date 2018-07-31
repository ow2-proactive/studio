# In the Java Home location field, use the value: "/usr" to force using the JRE provided in the docker image below (Recommended).
# Be aware, that the prefix command is internally split by spaces. So paths with spaces won't work.
# Prepare Docker parameters
containerName = 'java'
dockerRunCommand =  'docker run '
dockerParameters = '--rm '
# Prepare ProActive home volume
paHomeHost = variables.get("PA_SCHEDULER_HOME")
paHomeContainer = variables.get("PA_SCHEDULER_HOME") 
proActiveHomeVolume = '-v '+paHomeHost +':'+paHomeContainer+' '
# Prepare working directory (For Dataspaces and serialized task file)
workspaceHost = localspace
workspaceContainer = localspace
workspaceVolume = '-v '+localspace +':'+localspace+' '
# Prepare container working directory
containerWorkingDirectory = '-w '+workspaceContainer+' '
# Save pre execution command into magic variable 'preJavaHomeCmd', which is picked up by the node
preJavaHomeCmd = dockerRunCommand + dockerParameters + proActiveHomeVolume + workspaceVolume + containerWorkingDirectory + containerName