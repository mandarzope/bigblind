import { lambda } from 'templates';
export default ({ S3Bucket, Seeds, S3Key }) => lambda({
    S3Bucket,
    S3Key,
    Role: {
        "Fn::ImportValue": Seeds['seedts'] + "-AWSLambdaBasicExecutionRoleArn"
    }
})