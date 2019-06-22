import { Lambda, S3 } from 'aws-sdk';
export const RetryLambda = ({
    FunctionName,
    Payload,
    InvocationType = 'Event'
}) => {
    const lambda = new Lambda();
    return lambda.invoke({
        FunctionName,
        InvocationType,
        Payload
    }).promise()
}