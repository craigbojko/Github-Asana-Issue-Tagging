
module.exports = CustomError

if (typeof Object.setPrototypeOf === 'function') {
  Object.setPrototypeOf(CustomError.prototype, Error.prototype);
} else {
  CustomError.prototype = Object.create(Error.prototype);
}

function CustomError(code, message) {
  Object.defineProperty(this, 'name', {
    enumerable: false,
    writable: false,
    value: 'CustomError'
  })

  Object.defineProperty(this, 'code', {
    enumerable: true,
    writable: false,
    value: code
  })

  Object.defineProperty(this, 'message', {
    enumerable: false,
    writable: true,
    value: message
  })

  if (Error.hasOwnProperty('captureStackTrace')) { // V8
    Error.captureStackTrace(this, this.constructor);
  } else {
    Object.defineProperty(this, 'stack', {
      enumerable: false,
      writable: false,
      value: (new Error(message)).stack
    })
  }
}
