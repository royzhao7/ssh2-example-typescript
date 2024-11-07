const socketProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socketUrl = `${socketProtocol}//${window.location.host}`;
console.log('socketUrl:' + socketUrl)
const socket = new WebSocket(socketUrl);

socket.onmessage = (event) => {
    term.write(event.data);
}

var term = new Terminal({
    cursorBlink: true
});
const headlineElement = document.getElementById('terminal')
if (headlineElement) {
    term.open(headlineElement);
}

function init() {
    // if (term._initialized) {
    //     return;
    // }
    // term._initialized = true;
    // term.prompt = () => {
    //     runCommand('\n');
    // };
    // setTimeout(() => {
    //     term.prompt();
    // }, 300);

    term.onKey(keyObj => {
        console.log(keyObj)
        runCommand(keyObj.key);
    });

    term.attachCustomKeyEventHandler((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            navigator.clipboard.readText().then(text => {
                runCommand(text);
            });
            return false;
        }
        return true;
    });
}

function runCommand(command) {
    console.log(command)
    socket.send(command);

}

init();
