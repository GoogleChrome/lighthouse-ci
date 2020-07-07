# Docker-based LHCI Client

## Overview

The LHCI client can be run in any environment where Docker is available but root access to install dependencies is not.

Due to the nature of performance measurement and volatility of container-based resources in cloud environments, we **strongly advise against using this Docker image when you have the ability to install Chrome directly**.

## Running Locally

_NOTE: commands below were tested with Docker 18.09.2_

This docker image is already published to dockerhub as `patrickhulce/lhci-client` and can be used directly.

```bash
# Explanation of the command below
# 1. Run the container with SYS_ADMIN privileges so Chrome can sandbox processes
# 2. Mount a local directory to the .lighthouseci folder so we can persist reports
# 3. Run the prepublished LHCI client docker image
# 4. Run your LHCI command
docker container run --cap-add=SYS_ADMIN \
  -v "$(pwd)/lhci-data:/home/lhci/reports/.lighthouseci" \
  patrickhulce/lhci-client \
  lhci collect --url="https://example.com"
```

If you make modifications and need to push to your own dockerhub image...

```bash
docker image build -t lhci-client .
docker tag lhci-client:latest <your username>/lhci-client:latest
docker push <your username>/lhci-client:latest
```

In some cases the docker instance requires more shared memory than the default 64Mb otherwise tests will fail.

To increase shared memory in the docker use *--shm-size*:

```
docker container run --shm-size=2g --cap-add=SYS_ADMIN \
  -v "$(pwd)/lhci-data:/home/lhci/reports/.lighthouseci" \
  patrickhulce/lhci-client \
  lhci collect --url="https://example.com"
```

Also, lighthouse results vary a lot based on the CPU performance of the machine on which tests are running.
you can control the availability of CPU to docker using *--cpus*:

```
docker container run --cpus=".9" --shm-size=2g --cap-add=SYS_ADMIN \
  -v "$(pwd)/lhci-data:/home/lhci/reports/.lighthouseci" \
  patrickhulce/lhci-client \
  lhci collect --url="https://example.com"
```
The above command will provide 0.9 CPU from the available CPUs. In a 2 core processor, docker will have access to 45% of the CPU cycles. You can tune it as per your need. Keep a check on CPU/Memory Power at the bottom of your lighthouse report for consistent results.

## `--no-sandbox` Issues Explained

Chrome uses sandboxing to isolate renderer processes and restrict their capabilities. If a rogue website is able to discover a browser vulnerability and break out of JavaScript engine for example, they would find themselves in a very limited process that can't write to the filesystem, make network requests, mess with devices, etc.

Getting Chrome to run in CI and uncommon linux environments can frequently fail due to sandbox issues that present themselves in two common forms.

### Docker Permissions

**ERROR**

```
Failed to move to new namespace: PID namespaces supported, Network namespace supported, but failed: errno = Operation not permitted
```

**EXPLANATION**

This is happening because Docker is doing its own sandboxing of Chrome by preventing it from performing some sensitive system calls that it needs to sandbox its own containers!

This specific error means the Docker runtime didn't grant the container the privileges to clone user namespaces, which Chrome needs to do in order to sandbox. This is a straightforward fix; just tell Docker to allow the syscalls that Chrome needs! You can either tailor a custom security profile just for what Chrome needs (seccomp-chrome.json) or add the broad `SYS_ADMIN` capability to your container.

The tailored security profile adds these specific syscall permissions compared to the default.

```
arch_prctl
chroot
clone
fanotify_init
mlock
mlockall
name_to_handle_at
open_by_handle_at
setdomainname
sethostname
setns
unshare
vhangup
```

**SOLUTION:**

```
docker run --security-opt seccomp:./seccomp-chrome.json
```

OR

```
docker run --cap-add=SYS_ADMIN
```

If you're not able to change how docker is invoked because your CI provider runs your container, check their documentation on how to add capabilities necessary for Chrome. You can resort to `--no-sandbox` if necessary, see [`--no-sandbox` Container Tradeoffs](#sandbox-tradeoffs) for more information on this tradeoff.

### Lack of Kernel Support

You can also experience similar issues with sandboxing when your OS's kernel doesn't support namespacing (usually on Arch Linux). You have three options here:

- Recompile a custom kernel with support for namespacing
- Use another distro that has a kernel with support for namespacing
- Use `--no-sandbox` when launching Chrome

<a name="sandbox-tradeoffs"></a>

### `--no-sandbox` Container Tradeoffs

Depending on your container use case, `--no-sandbox` might not be all that bad.

If you're running untrusted binaries _other_ than Chrome in this container you're probably better off just running with `--no-sandbox`. The specific tradeoffs for your situation depend on your relative trustworthiness of the websites you intend to visit and the other binaries you intend to run locally.

For example, if you only run your own local code in Chrome for testing but download and execute binaries from the internet in the container, disable Chrome's sandbox and keep Docker's security model instead. In this example, the likelihood of code running in Chrome needing to be sandboxed is much lower than the likelihood of processes in your container needing to be sandboxed. Make your own tradeoffs accordingly.

### Links

[Docker default syscall whitelist](https://raw.githubusercontent.com/docker/labs/master/security/seccomp/seccomp-profiles/default.json)
[Chrome-specific syscall whitelist](https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/docker/seccomp/chrome.json)
[Jessie Frazelle's blog post on Chrome syscall hunting](https://blog.jessfraz.com/post/how-to-use-new-docker-seccomp-profiles/)
[GitHub issue discussion on tradeoffs of --no-sandbox vs. SYS_ADMIN](https://github.com/jessfraz/dockerfiles/issues/65#issuecomment-344956235)
