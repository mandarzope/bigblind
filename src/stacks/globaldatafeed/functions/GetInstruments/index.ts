import { stringify } from 'querystring';
import JsonParse from '../../../../common/JsonParse';
import { GetPath, Waiter } from '../../../../common/GlobalDataFeed';
import { RetryLambda } from '../../../../common/Lambda';
import Mysql from '../../../../common/Mysql';
// const BaseUrl = 'http://nimblerest.lisuns.com:4531';
const BaseUrl = 'http://test.lisuns.com:4531';



export const handler = async (event) => {
    const Path = '/GetInstruments';
    const qs = {
        accessKey: '1c26013e-5100-499a-a482-17b55bd5f87b',
        exchange: 'NFO',
        xml: false
    }
    const { success,
        action,
        data } = await GetPath<IGetInstrumentsOutput>({
            BaseUrl,
            Path,
            qs
        });

    if (success == true) {
        if (action == 'retry') {
            await Waiter(1000);
            await RetryLambda({
                FunctionName: "GetInstruments",
                Payload: JSON.stringify(event)
            })
        } else if (action == 'process') {
            const db = Mysql();
            await db.constatus();
            const batch = 100;
            const len = data.INSTRUMENTS.length;
            for (let i = 0; i < len; i += batch) {
                const end = Math.min(len, i + batch);
                var records = data.INSTRUMENTS.slice(i, end);
                var SQL = `INSERT INTO INSTRUMENTS (
                    EXCHANGE,
                    EXPIRY,
                    IDENTIFIER,
                    INDEXNAME,
                    NAME,
                    OPTIONTYPE,
                    PRICEQUOTATIONUNIT,
                    PRODUCT,
                    PRODUCTMONTH,
                    STRIKEPRICE,
                    TRADESYMBOL,
                    UNDERLYINGASSET,
                    UNDERLYINGASSETEXPIRY,
                    QUOTATIONLOT
                ) VALUES ${records.map(({
                    EXCHANGE,
                    EXPIRY,
                    IDENTIFIER,
                    INDEXNAME,
                    NAME,
                    OPTIONTYPE,
                    PRICEQUOTATIONUNIT,
                    PRODUCT,
                    PRODUCTMONTH,
                    STRIKEPRICE,
                    TRADESYMBOL,
                    UNDERLYINGASSET,
                    UNDERLYINGASSETEXPIRY,
                    QUOTATIONLOT
                }) => `(
                    ${db.escape(EXCHANGE)},
                    ${db.escape(EXPIRY)},
                    ${db.escape(IDENTIFIER)},
                    ${db.escape(INDEXNAME)},
                    ${db.escape(NAME)},
                    ${db.escape(OPTIONTYPE)},
                    ${db.escape(PRICEQUOTATIONUNIT)},
                    ${db.escape(PRODUCT)},
                    ${db.escape(PRODUCTMONTH)},
                    ${db.escape(STRIKEPRICE)},
                    ${db.escape(TRADESYMBOL)},
                    ${db.escape(UNDERLYINGASSET)},
                    ${db.escape(UNDERLYINGASSETEXPIRY)},
                    ${db.escape(QUOTATIONLOT)}
                )`).join(',')}
                ON DUPLICATE KEY UPDATE 
                EXCHANGE=VALUES(EXCHANGE),
                EXPIRY=VALUES(EXPIRY),
                IDENTIFIER=VALUES(IDENTIFIER),
                INDEXNAME=VALUES(INDEXNAME),
                NAME=VALUES(NAME),
                OPTIONTYPE=VALUES(OPTIONTYPE),
                PRICEQUOTATIONUNIT=VALUES(PRICEQUOTATIONUNIT),
                PRODUCT=VALUES(PRODUCT),
                PRODUCTMONTH=VALUES(PRODUCTMONTH),
                STRIKEPRICE=VALUES(STRIKEPRICE),
                TRADESYMBOL=VALUES(TRADESYMBOL),
                UNDERLYINGASSET=VALUES(UNDERLYINGASSET),
                UNDERLYINGASSETEXPIRY=VALUES(UNDERLYINGASSETEXPIRY),
                QUOTATIONLOT=VALUES(QUOTATIONLOT)`
                await db.queryPromise(SQL);
                console.log(i)
            }
            await db.destroy()
        }
    }
}
handler({})
    .then((d) => {
        console.log(d)
    });

interface IGetInstrumentsOutput {
    INSTRUMENTS: {
        EXCHANGE: string;
        EXPIRY: string;
        IDENTIFIER: string;
        INDEXNAME: string;
        NAME: string;
        OPTIONTYPE: string;
        PRICEQUOTATIONUNIT: string;
        PRODUCT: string;
        PRODUCTMONTH: string;
        STRIKEPRICE: number;
        TRADESYMBOL: string;
        UNDERLYINGASSET: string;
        UNDERLYINGASSETEXPIRY: string;
        QUOTATIONLOT: number;
    }[]
}