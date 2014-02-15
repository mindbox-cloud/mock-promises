function itImplementsContracts(PromiseLibrary) {
  describe("contracts", function() {
    var PromiseClass, PromiseWrapper, getDeferred;
    var fulfilledHandler1, fulfilledHandler2, errorHandler, progressHandler, promise1, promise2;
    beforeEach(function() {
      PromiseClass = PromiseLibrary.PromiseClass;
      PromiseWrapper = PromiseLibrary.PromiseWrapper;
      getDeferred = PromiseLibrary.getDeferred;
      PromiseClass = mockPromises.getMockPromise(PromiseClass);
      fulfilledHandler1 = jasmine.createSpy("fullfilled1");
      fulfilledHandler2 = jasmine.createSpy("fullfilled2");
      errorHandler = jasmine.createSpy("error");
      progressHandler = jasmine.createSpy("progress");
      promise1 = PromiseWrapper("foo");
      promise2 = PromiseWrapper("bar");
      promise1.then(fulfilledHandler1, errorHandler, progressHandler);
      promise2.then(fulfilledHandler2);
    });
    describe("all", function() {
      it("returns a list of promise/handler objects", function() {
        expect(mockPromises.contracts.all()).toEqual([
          jasmine.objectContaining({promise: promise1, fulfilledHandler: fulfilledHandler1, errorHandler: errorHandler, progressHandler: progressHandler}),
          jasmine.objectContaining({promise: promise2, fulfilledHandler: fulfilledHandler2})
        ]);
      });
    });
    describe("forPromise", function() {
      it("returns a list of promise/handler objects only for the requested promise", function() {
        expect(mockPromises.contracts.forPromise(promise1)).toEqual([
          jasmine.objectContaining({promise: promise1, fulfilledHandler: fulfilledHandler1, errorHandler: errorHandler, progressHandler: progressHandler})
        ]);
      });
    });

    it("can be reset", function() {
      expect(mockPromises.contracts.all().length).toBeGreaterThan(0);
      mockPromises.contracts.reset();
      expect(mockPromises.contracts.all().length).toEqual(0);
    });

    describe("executeForPromise", function() {
      it("calls handlers for that promise synchronously", function() {
        var promisedValue;
        promise1.then(function(value) {
          promisedValue = value;
        });
        promise2.then(function() {
          promisedValue = "also not foo";
        });
        promisedValue = "not foo";
        mockPromises.executeForPromise(promise1);
        expect(promisedValue).toEqual("foo");
      });

      describe("failed promises", function() {
        var deferred, brokenPromise, errorSpy, successSpy;
        beforeEach(function() {
          deferred = getDeferred();
          brokenPromise = deferred.promise;
          successSpy = jasmine.createSpy("success");
          errorSpy = jasmine.createSpy("error");
          deferred.reject("fail");
        });
        it("calls the fail handler if the promise is failed", function() {
          brokenPromise.then(successSpy, errorSpy);
          mockPromises.executeForPromise(brokenPromise);
          expect(successSpy).not.toHaveBeenCalled();
          expect(errorSpy).toHaveBeenCalledWith("fail");
        });
        it("supports 'catch'", function() {
          brokenPromise.catch(errorSpy);
          mockPromises.executeForPromise(brokenPromise);
          expect(errorSpy).toHaveBeenCalledWith("fail");
        });
      });

      it("does not execute handlers more than once", function() {
        var promisedValue = "bar";
        promise1.then(function(value) {
          promisedValue += value;
        });
        mockPromises.executeForPromise(promise1);
        mockPromises.executeForPromise(promise1);
        expect(promisedValue).toEqual("barfoo");
      });

      it("works with nested promises", function() {
        var innerPromise = PromiseWrapper("foo");
        var outerPromisedValue = "not resolved";
        var innerPromisedValue = "not resolved";
        var deferred = getDeferred();
        var outerPromise = deferred.promise;
        innerPromise.then(function(value) {
          innerPromisedValue = value;
          deferred.resolve(value + "bar");
        });
        outerPromise.then(function(value) {
          outerPromisedValue = value;
        });

        mockPromises.executeForPromise(innerPromise);
        expect(innerPromisedValue).toEqual("foo");
        expect(outerPromisedValue).toEqual("not resolved");
        mockPromises.executeForPromise(outerPromise);
        expect(innerPromisedValue).toEqual("foo");
        expect(outerPromisedValue).toEqual("foobar");
      });
    });

    describe("executeForResolvedPromises", function() {
      it("executes handlers for all resolved promises", function() {
        var deferred = getDeferred();
        var unresolvedPromise = deferred.promise;
        var unresolvedSpy = jasmine.createSpy("unresolved");
        unresolvedPromise.then(unresolvedSpy);
        mockPromises.executeForResolvedPromises();
        expect(fulfilledHandler1).toHaveBeenCalled();
        expect(fulfilledHandler2).toHaveBeenCalled();
        expect(unresolvedSpy).not.toHaveBeenCalled();
      });
    });

    describe("valueForPromise", function() {
      it("returns the value for resolved promises", function() {
        expect(mockPromises.valueForPromise(promise1)).toEqual("foo");
      });
    });
  });
}

describe("mock promises", function() {
  describe("mocking Q", function() {
    var QLibrary = {};
    beforeEach(function() {
      QLibrary.PromiseClass = Q.makePromise;
      QLibrary.PromiseWrapper = Q;
      QLibrary.getDeferred = function() {
        return Q.defer();
      };
      mockPromises.install(QLibrary.PromiseClass);
      mockPromises.contracts.reset();
    });

    afterEach(function() {
      mockPromises.uninstall();
    });

    it("does not allow normal promise resolution when mocking", function(done) {
      var promise = QLibrary.PromiseWrapper("foo");
      var promisedValue;
      promise.then(function(value) {
        promisedValue = value;
      });
      promisedValue = "not foo";
      setTimeout(function() {
        expect(promisedValue).toBe("not foo");
        done();
      }, 1);
    });

    it("can be uninstalled", function(done) {
      mockPromises.uninstall();

      var promise = QLibrary.PromiseWrapper("foo");
      var promisedValue;
      promise.then(function(value) {
        promisedValue = value;
      });
      promisedValue = "not foo";
      setTimeout(function() {
        expect(promisedValue).toBe("foo");
        done();
      }, 1);
    });

    it("maintains that then is chainable", function() {
      var promise = QLibrary.PromiseWrapper("chainThings");
      var chainedReturn = promise.then(function() {
      }).then(function() {
      });
      expect(chainedReturn).toBe(promise);
    });

    itImplementsContracts(QLibrary);
  });

  describe("for native promises", function() {
    var promise1, promise2;

    var nativeLibrary = {};
    beforeEach(function() {
      mockPromises.contracts.reset();
      Promise = mockPromises.getMockPromise(Promise);
      nativeLibrary.PromiseClass = Promise;
      nativeLibrary.PromiseWrapper = Promise.resolve
      nativeLibrary.getDeferred = function() {
        var deferred = {};
        var promise = new Promise(function(resolve, reject) {
          deferred.resolve = resolve;
          deferred.reject = reject;
        });
        deferred.promise = promise;
        return deferred;
      };

      promise1 = nativeLibrary.PromiseWrapper("foo");
      promise2 = nativeLibrary.PromiseWrapper("bar");
    });

    afterEach(function() {
      Promise = mockPromises.getOriginalPromise();
      mockPromises.uninstall();
    });

    itImplementsContracts(nativeLibrary);

    describe("Promises.all", function() {
      it("resolves when all of the promises resolve", function() {
        var allPromise = Promise.all([promise1, promise2]);
        var thenSpy = jasmine.createSpy("then");
        allPromise.then(thenSpy);
        mockPromises.executeForPromise(promise1);
        mockPromises.executeForPromise(promise2);
        mockPromises.executeForPromise(allPromise);
        expect(thenSpy).toHaveBeenCalledWith(["foo", "bar"]);
      });
    });

    describe("Promise.reject", function() {
      it("creates a rejected promise", function() {
        var rejectedPromise = Promise.reject("wrong");
        var failSpy = jasmine.createSpy("fail");
        rejectedPromise.catch(failSpy);
        mockPromises.executeForPromise(rejectedPromise);
        expect(failSpy).toHaveBeenCalledWith("wrong");
      });
    });
  });
});
