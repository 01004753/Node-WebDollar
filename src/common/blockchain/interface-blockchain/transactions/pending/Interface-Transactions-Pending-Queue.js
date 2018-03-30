import InterfaceBlockchainTransactionsProtocol from "../protocol/Interface-Blockchain-Transactions-Protocol"

import consts from 'consts/const_global'

class InterfaceTransactionsPendingQueue {

    constructor(blockchain, db){

        this.blockchain = blockchain;
        this.list = [];

        this.db = db;

    }

    includePendingTransaction (transaction, exceptSockets){

        if (this.findPendingTransaction(transaction) !== -1)
            return false;

        let blockValidation = { blockValidationType: {
            "take-transactions-list-in-consideration": {
                validation: true
            }
        }};

        if (!transaction.validateTransactionOnce(this.blockchain.blocks.length-1, blockValidation ))
            return false;

        this._insertPendingTransaction(transaction);


        this.propagateTransaction(transaction, exceptSockets);


        this._removeOldTransactions();

        return true;

    }

    _insertPendingTransaction(transaction){

        for (let i=0; i<this.list.length; i++ ) {
            let compare = transaction.from.addresses[0].unencodedAddress.compare(this.list[i].from.addresses[0].unencodedAddress);

            if (compare < 0) // next
                continue;
            else
            if (compare === 0){ //order by nonce

                if (transaction.nonce > this.list[i].nonce){
                    this.list.splice(i, 0, transaction);
                }

            }
            else
            if (compare > 0) { // i will add it
                this.list.splice(i, 0, transaction);
                break;
            }

        }

        this.list.push(transaction);
    }

    findPendingTransaction(transaction){


        for (let i = 0; i < this.list.length; i++)
            if ( this.list[i].txId.equals( transaction.txId) )
                return i;

        return -1;
    }

    removePendingTransaction (transaction){

        let index = transaction;

        if (typeof transaction === "object") index = this.findPendingTransaction(transaction);

        if (index === -1)
            return true;

        this.list.splice(index, 1);
    }

    _removeOldTransactions (){

        for (let i=this.list.length-1; i >= 0; i--) {

            try{

                let blockValidation = { blockValidationType: {
                    "take-transactions-list-in-consideration": {
                        validation: true
                    }
                }};

                if (!this.list[i].validateTransactionEveryTime(undefined, blockValidation ))
                    this.list.splice(i, 1);

            } catch (exception){
                console.warn("Old Transaction removed because of exception ", exception)
                this.list.splice(i, 1);
            }

        }

    }

    propagateTransaction(transaction, exceptSocket){
        InterfaceBlockchainTransactionsProtocol.propagateNewPendingTransaction(transaction, exceptSocket)
    }


}

export default InterfaceTransactionsPendingQueue