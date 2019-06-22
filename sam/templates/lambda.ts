const Type = 'AWS::Lambda::Function';
export const lambda = ({
    S3Bucket,
    S3Key,
    Timeout = 25,
    MemorySize = 128,
    Runtime = 'nodejs10.x',
    Role,
    Handler = 'index.handler'
}) => ({
    Type,
    Properties: {
        Code: {
            S3Bucket,
            S3Key,
        },
        Handler,
        Role,
        Runtime,
        Timeout,
        MemorySize
    }
})