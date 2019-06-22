// "Outputs" : {
//     "Logical ID" : {
//       "Description" : "Information about the value",
//       "Value" : "Value to return",
//       "Export" : {
//         "Name" : "Value to export"
//       }
//     }
//   }
export default () => ({
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "AWS CloudFormation sample template that contains a single Lambda function behind an API Gateway",
    "Outputs": {
        "Logical ID": {
            "Description": "Information about the value",
            "Value": "Value to return",
            "Export": {
                "Name": "Value to export"
            }
        }
    },
    "Resources": {
        "ServerLessLambda": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "serverless-${AWS::Region}-${AWS::AccountId}"
                },
                "AccessControl": "PublicReadWrite"
            }
        },
        "AWSLambdaBasicExecutionRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": [
                                    "lambda.amazonaws.com"
                                ]
                            },
                            "Action": [
                                "sts:AssumeRole"
                            ]
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                ],
                "Path": "/",
                "RoleName": "LAMBDA_BASIC_EXECUTION_ROLE"
            }
        }
    }
})