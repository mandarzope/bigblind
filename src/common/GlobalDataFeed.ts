import { get } from 'request';
import JsonParse from './JsonParse';

export function GetPath<T>({
    BaseUrl,
    Path,
    qs
}) {
    return new Promise<{
        success: boolean;
        action?: string;
        data?: T;
    }>((resolve, reject) => {
        get(`${BaseUrl}/${Path}`, {
            qs
        }, (e, r, b) => {
            if (typeof b == 'string') {
                if (b.indexOf('Data for requested exchange is disabled') >= 0) {
                    console.log(b)
                    resolve({
                        success: true,
                        action: 'close'
                    })
                } else if (b.indexOf('Authentication request received. Try request data in next moment.') >= 0) {
                    console.log(b)
                    resolve({
                        success: true,
                        action: 'retry'
                    })
                } else {
                    resolve({
                        success: true,
                        action: 'process',
                        data: JsonParse(b)
                    })
                }
                return
            }
            resolve({
                success: false
            })
            // resolve(b);
        })
    })
}
export const Waiter = (t: number) => new Promise(function (resolve, reject) {
    setTimeout(function () {
        resolve()
    }, t)
})