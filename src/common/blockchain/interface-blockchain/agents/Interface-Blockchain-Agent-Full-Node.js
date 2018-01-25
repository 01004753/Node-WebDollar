import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

class InterfaceBlockchainAgentFullNode extends InterfaceBlockchainAgent{

    _initializeProtocol(){

        this.protocol.initialize(["acceptBlockHeaders", "acceptBlocks" ]);
    }

}

export default InterfaceBlockchainAgentFullNode;