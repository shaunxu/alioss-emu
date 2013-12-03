(function () {
    'use strict';

    var errors = {
        AccessDenied: {
            code: 'AccessDenied', 
            statusCode: 403, 
            message: '' 
        },
        BucketAlreadyExists: { 
            code: 'BucketAlreadyExists', 
            statusCode: 409, 
            message: '' 
        },
        BucketNotEmpty: { 
            code: 'BucketNotEmpty', 
            statusCode: 409, 
            message: '' 
        },
        EntityTooLarge: { 
            code: 'EntityTooLarge', 
            statusCode: 400, 
            message: '' 
        },
        EntityTooSmall: { 
            code: 'EntityTooSmall', 
            statusCode: 400, 
            message: '' 
        },
        FileGroupTooLarge: { 
            code: 'FileGroupTooLarge', 
            statusCode: 400, 
            message: '' 
        },
        FilePartNotExist: { 
            code: 'FilePartNotExist', 
            statusCode: 400, 
            message: '' 
        },
        FilePartStale: { 
            code: 'FilePartStale', 
            statusCode: 400, 
            message: '' 
        },
        InvalidArgument: { 
            code: 'InvalidArgument', 
            statusCode: 400, 
            message: '' 
        },
        InvalidAccessKeyId: { 
            code: 'InvalidAccessKeyId', 
            statusCode: 403, 
            message: '' 
        },
        InvalidBucketName: { 
            code: 'InvalidBucketName', 
            statusCode: 400, 
            message: '' 
        },
        InvalidDigest: { 
            code: 'InvalidDigest', 
            statusCode: 400, 
            message: '' 
        },
        InvalidEncryptionAlgorithmError: { 
            code: 'InvalidEncryptionAlgorithmError', 
            statusCode: 400, 
            message: '' 
        },
        InvalidObjectName: { 
            code: 'InvalidObjectName', 
            statusCode: 400, 
            message: '' 
        },
        InvalidPart: { 
            code: 'InvalidPart', 
            statusCode: 400, 
            message: '' 
        },
        InvalidPartOrder: { 
            code: 'InvalidPartOrder', 
            statusCode: 400, 
            message: '' 
        },
        InvalidTargetBucketForLogging: { 
            code: 'InvalidTargetBucketForLogging', 
            statusCode: 400, 
            message: '' 
        },
        InternalError: { 
            code: 'InternalError', 
            statusCode: 500, 
            message: '' 
        },
        MalformedXML: { 
            code: 'MalformedXML', 
            statusCode: 400, 
            message: '' 
        },
        MethodNotAllowed: { 
            code: 'MethodNotAllowed', 
            statusCode: 405, 
            message: '' 
        },
        MissingArgument: { 
            code: 'MissingArgument', 
            statusCode: 411, 
            message: '' 
        },
        MissingContentLength: { 
            code: 'MissingContentLength', 
            statusCode: 411, 
            message: '' 
        },
        NoSuchBucket: { 
            code: 'NoSuchBucket', 
            statusCode: 404, 
            message: '' 
        },
        NoSuchKey: { 
            code: 'NoSuchKey', 
            statusCode: 404, 
            message: '' 
        },
        NoSuchUpload: { 
            code: 'NoSuchUpload', 
            statusCode: 404, 
            message: '' 
        },
        NotImplemented: { 
            code: 'NotImplemented', 
            statusCode: 501, 
            message: '' 
        },
        PreconditionFailed: { 
            code: 'PreconditionFailed', 
            statusCode: 412, 
            message: '' 
        },
        RequestTimeTooSkewed: { 
            code: 'RequestTimeTooSkewed', 
            statusCode: 403, 
            message: '' 
        },
        RequestTimeout: { 
            code: 'RequestTimeout', 
            statusCode: 400, 
            message: '' 
        },
        SignatureDoesNotMatch: { 
            code: 'SignatureDoesNotMatch', 
            statusCode: 403, 
            message: '' 
        },
        TooManyBuckets: { 
            code: 'TooManyBuckets', 
            statusCode: 400, 
            message: '' 
        }
    };

    module.exports = errors;

})();