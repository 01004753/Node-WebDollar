const EventEmitter = require('events');
import consts from 'consts/const_global'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';

class PoolStatistics{

    constructor(poolManagement, databaseName){

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.poolManagement = poolManagement;

        this.POOL_STATISTICS_TIME = 5000;
        this.POOL_STATISTICS_MEAN_VALUES = 10;

        this.poolHashes = 0;
        this.poolHashesNow = 0;

        this.poolMinersOnline ={
            length: 0,
        };
        this.poolMinersOnlineNow = {
            length: 0
        };


        this.poolBlocksUnconfirmed = 0;
        this.poolBlocksConfirmed = 0;
        this.poolTimeRemaining = 0;


        this.poolBlocksConfirmedAndPaid = 0;
        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.SERVER_POOL_DATABASE );

        //calculate mean
        this._poolHashesLast = [];
        this._poolMinersOnlineLast = [];

    }

     initializePoolStatistics(){

        return  this._load();

    }

    startInterval(){
        this._interval = setInterval( this._poolStatisticsInterval.bind(this), this.POOL_STATISTICS_TIME );
        this._saveInterval = setInterval( this._save.bind(this), 5*this.POOL_STATISTICS_TIME);
    }

    clearInterval(){
        clearInterval(this._interval);
        clearInterval(this._saveInterval);
    }

    _poolStatisticsInterval(){

        let poolHashes = Math.floor( this.poolHashesNow / (this.POOL_STATISTICS_TIME/1000));

        let poolMinersOnline = this.poolMinersOnlineNow;


        if (this._poolHashesLast.length === this.POOL_STATISTICS_MEAN_VALUES ){

            for (let i=0; i<this._poolHashesLast.length-1; i++) {
                this._poolHashesLast[i] = this._poolHashesLast[ i + 1 ];
                this._poolMinersOnlineLast[i] = this._poolMinersOnlineLast[ i + 1 ];
            }

            this._poolHashesLast[this._poolHashesLast.length-1] = poolHashes;
            this._poolMinersOnlineLast[this._poolMinersOnlineLast.length-1] = poolMinersOnline;

        } else{
            this._poolHashesLast.push(poolHashes);
            this._poolMinersOnlineLast.push(poolMinersOnline);
        }

        let poolHashesMean = 0;
        let poolMinersOnlineMean = {
            length: 0,
        };

        for (let i=0; i < this._poolHashesLast.length; i++)
            poolHashesMean += this._poolHashesLast[i];

        for (let i=0; i < this._poolMinersOnlineLast.length; i++)
            poolMinersOnlineMean.length += this._poolMinersOnlineLast[i].length;

        this.poolHashes = poolHashesMean  / this._poolHashesLast.length;
        this.poolMinersOnline = {
            length: poolMinersOnlineMean.length /  this._poolMinersOnlineLast.length
        };

        this.emitter.emit("pools/statistics/update", { poolHashes: this.poolHashes, poolMinersOnline: this.poolMinersOnline, poolBlocksConfirmed: this.poolBlocksConfirmed,  poolBlocksUnconfirmed: this.poolBlocksUnconfirmed, poolTimeRemaining: this.poolTimeRemaining, });

    }


    addStatistics(hashes, minerInstance){

        this.poolManagement.poolStatistics.poolHashesNow += hashes.toNumber();


        if (this.poolMinersOnlineNow[minerInstance.publicKeyString] === undefined) {
            this.poolMinersOnlineNow[minerInstance.publicKeyString] = minerInstance;
            this.poolMinersOnlineNow.length ++;
        }

    }

    addBlocksStatistics(blocksConfirmed, blocksUnconfirmed, blocksConfirmedAndPaid ){

        this.poolBlocksUnconfirmed = blocksUnconfirmed;
        this.poolBlocksConfirmed = blocksConfirmed;
        this.poolBlocksConfirmedAndPaid += blocksConfirmedAndPaid;

    }



    async _save(){

        await this._db.save("serverPool_statistics_confirmedAndPaid", this.poolBlocksConfirmedAndPaid )

    }

    async _load(){

         let confirmedAndPaid = await this._db.get("serverPool_statistics_confirmedAndPaid", 30*1000, true);

         if (typeof confirmedAndPaid === "number")
             this.poolBlocksConfirmedAndPaid = confirmedAndPaid;

         return true;
    }

}

export default PoolStatistics;