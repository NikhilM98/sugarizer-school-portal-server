# Sugarizer School Portal

[Sugarizer](https://github.com/llaske/sugarizer) is the open-source learning platform based on Sugar that began in the famous One Laptop Per Child project.

[Sugarizer Server](https://github.com/llaske/sugarizer-server) allows the deployment of Sugarizer on a local server, for example on a school server, so expose locally Sugarizer as a Web Application. Sugarizer Server can also be used to provide collaboration features for Sugarizer Application on the network. Sugarizer Server could be deployed in a Docker container or on any computer with Node.js 6+ and MongoDB 2.6+.

Sugarizer School Portal is a new tool in the Sugarizer family which provides a way for schools interested by Sugarizer to host and manage themselves their Sugarizer deployment. It provides an on-demand (SaaS) Sugarizer Server deployment tool so that every school will be able to create a Sugarizer Server to host its own deployment without any technical skill in just a few clicks.

Under the hood, Sugarizer School Portal is a Kubernetes cluster that is able to create/manage on-demand new Sugarizer Server instances.

## Install using Helm (Inside the cluster itself)

[Sugarizer School Portal Chart](https://github.com/nikhilm98/sugarizer-school-portal-chart/) can be used for setting up Sugarizer School Portal Server deployment on a Kubernetes cluster (Currently supports only GKE). Refer to [this](https://github.com/nikhilm98/sugarizer-school-portal-chart/) repository for setup and deployment instructions.

## Install on a separate system

You can follow these steps to set-up Sugarizer School Portal Server on a system.
You can either use Sugarizer School Portal Server with a Kubernetes cluster on an online provider (Like GKE) or you can set-up your own local Kubernetes cluster using MicroK8s.    

### Set-up correct [Sugarizer-Chart](https://github.com/NikhilM98/sugarizer-chart) environment

Sugarizer-Chart is a [Helm](https://helm.sh/) Chart for setting up Sugarizer-Server deployment on a Kubernetes cluster. It currently supports two providers:
- [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine) (GKE) - [README](https://github.com/NikhilM98/sugarizer-chart/blob/master/gke-enviornment/README.md)
- [Microk8s](https://microk8s.io) (It basically provides a bare-metal Kubernetes cluster) - [README](https://github.com/NikhilM98/sugarizer-chart/blob/master/microk8s-enviornment/README.md)

Clone the Sugarizer-Chart
```
git clone https://github.com/NikhilM98/sugarizer-chart
```
Set-up the environment depending on the provider you will be using. You also need to configure the values in corresponding `values.yaml` for the chart.
Note that you don't need to set `schoolShortName` and `hostName` values as they will be overwritten.

### Install MongoDB

You can follow MongoDB [documentation](https://docs.mongodb.com/manual/installation/) to install MongoDB in your system.

### Install Sugarizer School Portal Server

Make sure that you have correct Sugarizer-Chart environment set up and MongoDB installed on your system. To install Sugarizer School Portal Server follow these steps:
```bash
git clone https://github.com/NikhilM98/sugarizer-school-portal-server.git
cd sugarizer-school-portal-server
npm install
```
You need to make some changes in the [configuration](env/config.ini) file before starting the Sugarizer School Portal. Update the [system] section in [env/config.ini](env/config.ini) according to your system.

### Running Sugarizer School Portal

After making the required changes in the [configuration](env/config.ini) file. You can start Sugarizer School Portal by running this command:
```
npm start
```

To login to the Dashboard the first time, you will have to create an admin account using this command:
```
sh add-admin.sh admin password http://127.0.0.1:8080/auth/signup
```

## Server Configuration

Sugarizer School Portal configuration is load by default from file [env/config.ini](env/config.ini). Following is the typical content of the configuration file:
```
[information]
name = Sugarizer School Portal
description = Web Interface for Sugarizer School Portal

[web]
port = 8080

[security]
min_password_size = 4
max_age = 172800000
https = false
certificate_file = ../server.crt
key_file = ../server.key
strict_ssl = false
salt_rounds = 10

[database]
server = 127.0.0.1
port = 27017
name = schoolportal
waitdb = 1

[collections]
users = users
deployments = deployments

[system]
helm_binary = microk8s.helm3
kubectl_binary = microk8s.kubectl
chart_path = ../sugarizer-chart/microk8s-enviornment/sugarizer-chart/
provider = microk8s # Options: microk8s, gke
replicaset = true
databaseUrl = mymongodb

[log]
level = 1
```

The **[information]** section is for describing your Sugarizer School Portal. It could be useful for clients connected to the portal.

The **[web]** section describes the settings of the node.js process. By default, the webserver is on the port 8080.

The **[security]** section regroup security settings. `min_password_size` is the minimum number of characters for the password. `max_age` is the expiration time in milliseconds of a session with the client. At the expiration of the session, the client should reenter its password. The default time is 172800000 (48 hours). Parameters `https`, `certificate_file`, `key_file` and `strict_ssl` are explained below.
change this value if you want to use another port.

The **[database]** and **[collections]** sections are for MongoDB settings. You could update the server name (by default MongoDB run locally) and the server port. Names of the database and collections had no reason to be changed. The `waitdb` parameter allows you to force the server to wait for the database.

The **[system]** section indicates the system configuration:
- The `helm_binary` value determines the location of the helm binary file in the system. If you're using Microk8s, then setting `helm_binary` to `microk8s.helm3` will be fine.  
- The `kubectl_binary` value determines the location of the kubectl binary file in the system. If you're using Microk8s, then setting `kubectl_binary` to `microk8s.kubectl` will be fine.  
- The `chart_path` value determines the location of the sugarizer-chart folder in the system.  
- The `provider` value determines the Kubernetes cluster provider. It can be `microk8s` or `gke`.  
- The `replicaset` value determines if MongoDB Replicaset is installed in the cluster. It can be set to `true` or `false`.  
- The `databaseUrl` value determines the URL of the MongoDB database in the cluster. If `replicaset` is `true` then it is the name of the MongoDB Replicaset chart, like `mymongodb`. If `replicaset` is `false` then it is the local URL of the MongoDB database in the cluster, like `sugarizer-service-db-mymongodb.sugarizer-mymongodb.svc.cluster.local`.  

The **[log]** section indicates how the server log access. If `level` value is greater than 0 or is not present, Sugarizer School Portal will log all access to the server on the command line.

## Running Sugarizer School Portal securely using SSL (Optional and not required if Helm is used for setup)

Sugarizer School Portal could be run securely using SSL.
Few parameters in the **[security]** section of the configuration file are dedicated to that.

* To run the server securely set `https` parameter to `true`.
* `certificate_file` and `key_file` are the path to certificate and key file to sign requests.
* `strict_ssl` should be set to `false` if your certificate is a self-signed certificate or is a certificate not signed by a trusted authority.


## License

This project is licensed under `Apache v2` License. See [LICENSE](LICENSE) for full license text.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
