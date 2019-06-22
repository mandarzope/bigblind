import { createConnection, escape } from 'mysql';
export default function () {
    var connection = createConnection({
        host: 'bigblind-1-instance-1.cam7z3jnu3hh.ap-south-1.rds.amazonaws.com',
        port: 3306,
        user: 'bigblind',
        password: 'Lucky777',
        database: 'bigblind1instance1',
        multipleStatements: true
    });

    function queryPromise(q1, q2 = null) {
        return new Promise<any>(function (resolve, reject) {
            if (!!q1 && !!q2) {
                connection.query(q1, q2, function (e, r) {
                    if (e) {
                        console.log("error", e)
                        reject(e);
                    } else {
                        // console.log("executed", q1, q2)
                        resolve(r);
                    }
                })
            } else if (!!q1) {
                connection.query(q1, function (e, r) {
                    if (e) {
                        console.log("error", e)
                        reject(e);
                    } else {
                        // console.log("executed", q1)
                        resolve(r);
                    }
                })
            } else {
                reject({
                    error: 'Invalid Input'
                })
            }
        })
    }
    let constatus = () => new Promise((resolve, reject) => {
        connection.connect(() => {
            resolve();
        });
    });
    let destroy = () => connection.destroy();

    return {
        queryPromise,
        constatus,
        destroy,
        escape
    }
}