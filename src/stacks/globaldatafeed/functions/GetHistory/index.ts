import { stringify } from 'querystring';
import JsonParse from '../../../../common/JsonParse';
import { GetPath, Waiter } from '../../../../common/GlobalDataFeed';
import { RetryLambda } from '../../../../common/Lambda';
import Mysql from '../../../../common/Mysql';
// const BaseUrl = 'http://nimblerest.lisuns.com:4531';
const BaseUrl = 'http://test.lisuns.com:4531';



export const handler = async (event) => {
    const Path = '/GetHistory';
    const { instrumentIdentifier, periodicity, from, to } = event;
    const periodicityTOKey = {
        MINUTE: 'OHLC',
        TICK: 'TICK'
    }
    const qs = {
        accessKey: '1c26013e-5100-499a-a482-17b55bd5f87b',
        exchange: 'NFO',
        instrumentIdentifier,
        periodicity,
        from,
        to,
        xml: false
        // max:100
    }

    const db = Mysql();
    await db.constatus();
    const [NAME, PRODUCT, PRODUCTMONTH, OPTIONTYPE, STRIKEPRICE] = instrumentIdentifier.split('_');
    const Key = periodicityTOKey[periodicity];
    const TableName = `${Key}_${PRODUCT}_${NAME}`;
    const TableCreate = Table[periodicity]({
        TableName: `${Key}_${PRODUCT}_${NAME}`
    })
    const TableDescribe = await db.queryPromise(TableCreate).catch((e) => {
        return {
            success: false,
            code: e.code
        }
    });
    const { success,
        action,
        data } = await GetPath<IGetInstrumentsOutput>({
            BaseUrl,
            Path,
            qs
        });
    console.log(data);
    if (success == true) {
        if (action == 'retry') {
            await Waiter(1000);
            // await RetryLambda({
            //     FunctionName: "GetHistory",
            //     Payload: JSON.stringify(event)
            // })
        } else if (action == 'process') {
            // const db = Mysql();
            // await db.constatus();
            const batch = 100;
            // const [NAME, PRODUCT, PRODUCTMONTH, OPTIONTYPE, STRIKEPRICE] = instrumentIdentifier.split('_');

            const TableName = '';
            const key = periodicityTOKey[periodicity];
            // for (let i = 0; i < len; i += batch) {
            //     const end = Math.min(len, i + batch);
            //     var records = data.INSTRUMENTS.slice(i, end);
            //     var SQL = `INSERT INTO INSTRUMENTS (
            //         EXCHANGE,
            //         EXPIRY,
            //         IDENTIFIER,
            //         INDEXNAME,
            //         NAME,
            //         OPTIONTYPE,
            //         PRICEQUOTATIONUNIT,
            //         PRODUCT,
            //         PRODUCTMONTH,
            //         STRIKEPRICE,
            //         TRADESYMBOL,
            //         UNDERLYINGASSET,
            //         UNDERLYINGASSETEXPIRY,
            //         QUOTATIONLOT
            //     ) VALUES ${records.map(({
            //         EXCHANGE,
            //         EXPIRY,
            //         IDENTIFIER,
            //         INDEXNAME,
            //         NAME,
            //         OPTIONTYPE,
            //         PRICEQUOTATIONUNIT,
            //         PRODUCT,
            //         PRODUCTMONTH,
            //         STRIKEPRICE,
            //         TRADESYMBOL,
            //         UNDERLYINGASSET,
            //         UNDERLYINGASSETEXPIRY,
            //         QUOTATIONLOT
            //     }) => `(
            //         ${db.escape(EXCHANGE)},
            //         ${db.escape(EXPIRY)},
            //         ${db.escape(IDENTIFIER)},
            //         ${db.escape(INDEXNAME)},
            //         ${db.escape(NAME)},
            //         ${db.escape(OPTIONTYPE)},
            //         ${db.escape(PRICEQUOTATIONUNIT)},
            //         ${db.escape(PRODUCT)},
            //         ${db.escape(PRODUCTMONTH)},
            //         ${db.escape(STRIKEPRICE)},
            //         ${db.escape(TRADESYMBOL)},
            //         ${db.escape(UNDERLYINGASSET)},
            //         ${db.escape(UNDERLYINGASSETEXPIRY)},
            //         ${db.escape(QUOTATIONLOT)}
            //     )`).join(',')}
            //     ON DUPLICATE KEY UPDATE 
            //     EXCHANGE=VALUES(EXCHANGE),
            //     EXPIRY=VALUES(EXPIRY),
            //     IDENTIFIER=VALUES(IDENTIFIER),
            //     INDEXNAME=VALUES(INDEXNAME),
            //     NAME=VALUES(NAME),
            //     OPTIONTYPE=VALUES(OPTIONTYPE),
            //     PRICEQUOTATIONUNIT=VALUES(PRICEQUOTATIONUNIT),
            //     PRODUCT=VALUES(PRODUCT),
            //     PRODUCTMONTH=VALUES(PRODUCTMONTH),
            //     STRIKEPRICE=VALUES(STRIKEPRICE),
            //     TRADESYMBOL=VALUES(TRADESYMBOL),
            //     UNDERLYINGASSET=VALUES(UNDERLYINGASSET),
            //     UNDERLYINGASSETEXPIRY=VALUES(UNDERLYINGASSETEXPIRY),
            //     QUOTATIONLOT=VALUES(QUOTATIONLOT)`
            //     await db.queryPromise(SQL);
            //     console.log(i)
            // }
            await db.destroy()
        }
    }
    await db.destroy()
}
var now = Math.round(new Date().valueOf() / 1000);
handler({
    instrumentIdentifier: 'OPTIDX_BANKNIFTY_27JUN2019_CE_30200',
    periodicity: 'MINUTE',
    from: (now - 1000),
    to: now
})
    .then((d) => {
        console.log(d)
    });

interface IGetInstrumentsOutput {
    MINUTE: {
        CLOSE: number;
        HIGH: number;
        LASTTRADETIME: number;
        LOW: number;
        OPEN: number;
        OPENINTEREST: number;
        QUOTATIONLOT: number;
        TRADEDQTY: number;
    }[]
}
const Table = {
    "MINUTE": ({ TableName }) => `
    CREATE TABLE IF NOT EXISTS ${TableName} (
        ID INT(11) UNSIGNED NOT NULL,
        CLOSE DECIMAL(11,2) NOT NULL,
        HIGH DECIMAL(11,2) NOT NULL,
        LASTTRADETIME INT(11) NOT NULL,
        LOW DECIMAL(11,2) NOT NULL,
        OPEN DECIMAL(11,2) NOT NULL,
        OPENINTEREST INT(11) NOT NULL,
        QUOTATIONLOT INT(11) NOT NULL,
        TRADEDQTY INT(11) NOT NULL,
        FOREIGN KEY 
        (ID) REFERENCES INSTRUMENTS (ID) ON DELETE CASCADE ON UPDATE CASCADE
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
}