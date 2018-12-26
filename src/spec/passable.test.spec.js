import Passable from '../Passable';
import { expect } from 'chai';
import { WARN, FAIL } from '../index';
import { noop, random, sample, toString, clone } from 'lodash';
import { lorem } from 'faker';
import sinon from 'sinon';

describe("Tests Passable's `test` functionality", () => {

    describe('method: test', () => {
        describe('Supplied test callback is either a promise or a function', () => {
            let instance;
            const allTests = [];

            beforeEach(() => {
                instance = new Passable('formname', noop);
                allTests.length = 0;

                for (let i = 0; i < random(1, 15); i++) {
                    allTests.push(() => null);
                }
            });

            it('Should call `addPendingTest` for each test called', () => {
                let callCounter = 0;
                instance.addPendingTest = () => ++callCounter;
                allTests.forEach((test) => instance.test(lorem.word(), lorem.sentence(), test));
                expect(callCounter).to.equal(allTests.length);
            });

            it('Should assign `fieldName`, `statement` and `severity` to test callback', () => {
                const severities = [WARN, FAIL];
                const savedValues = [];

                allTests.forEach((test, i) => {
                    const fieldName = lorem.word();
                    const statement = lorem.sentence();
                    const severity = sample(severities);
                    savedValues[i] = { fieldName, statement, severity };
                    instance.test(fieldName, statement, test, severity);

                });

                allTests.forEach((test, i) => {
                    expect(test.fieldName).to.equal(savedValues[i].fieldName);
                    expect(test.statement).to.equal(savedValues[i].statement);
                    expect(test.severity).to.equal(savedValues[i].severity);
                });
            });
        });

        describe('Supplied test callback is not supported', () => {
            let instance;

            beforeEach(() => {
                instance = new Passable('formname', noop);
            });


            [0, 1, [], [55], {}, false, true, null, undefined].forEach((testCb) => {
                it(`Should return without calling 'addPendingTest' for ${testCb}`, () => {
                    let callCounter = 0;
                    instance.addPendingTest = () => ++callCounter;
                    instance.test(lorem.word(), lorem.sentence(), testCb);
                    expect(callCounter).to.equal(0);
                });
            });
        });
    });

    describe('method: runPendingTests', () => {
        let instance, allTests;

        beforeEach(() => {
            allTests = [];
            for (let i = 0; i < random(1, 15); i++) {
                allTests.push(sinon.spy());
            }
            instance = new Passable('formname', (test) => allTests.forEach((t) => {
                test(lorem.word(), lorem.sentence(), t);
            }));
        });

        it('Should call all test callbacks', () => {
            allTests.forEach((test) => {
                expect(test.calledOnce).to.equal(true);
            });
        });

        it('Should clear pending tests list', () => {
            expect(instance.pending).to.be.empty;
        });

        it('Should call bumpTestCounter for each of the tests', () => {
            const count = random(1, 15);
            const spy = sinon.spy();

            for (let i = 0; i < count; i++) {
                const test = sinon.spy();
                test.fieldName = lorem.word();
                test.statement = lorem.sentence();
                instance.pending.push(test);
            }
            instance.res.bumpTestCounter = spy;
            instance.runPendingTests();
            expect(spy.callCount).to.equal(count);
        });

        describe('async test behavior', () => {
            describe('failing', () => {
                beforeEach(() => {
                    instance = new Passable('formname', (test) => {
                        test(lorem.word(), lorem.sentence(), new Promise((resolve, reject) => setImmediate(reject)));
                    });
                });

                it('Should immediately register test', () => {
                    expect(instance.res.testCount).to.equal(1);
                });

                it('Should mark response object as `async`', () => {
                    expect(instance.res.async).to.equal(true);
                });

                it('Should only marke test as failing after rejection', (done) => {
                    expect(instance.res.failCount).to.equal(0);
                    setTimeout(() => {
                        expect(instance.res.failCount).to.equal(1);
                        done();
                    }, 10);
                });
            });

            describe('passing', () => {
                beforeEach(() => {
                    instance = new Passable('formname', (test) => {
                        test(lorem.word(), lorem.sentence(), new Promise((resolve, reject) => setImmediate(resolve)));
                    });
                });

                it('Should keep test unchanged after resolution', (done) => {
                    const res = clone(instance.res);
                    setTimeout(() => {
                        expect(instance.res).to.deep.equal(res);
                        done();
                    }, 10);
                });
            });
        });

        describe('sync test behavior', () => {
            it('should mark a test as failed for a thrown error', () => {
                const name = lorem.word();
                instance = new Passable(lorem.word(), (test) => {
                    test(name, lorem.sentence(), () => { throw new Error(); });
                    test(lorem.word(), lorem.sentence(), noop);
                });
                expect(instance.res.failCount).to.equal(1);
                expect(instance.res.validationErrors).to.have.key(name);
            });

            it('Should keep responseObject:async as untouched', () => {
                const name = lorem.word();
                instance = new Passable(lorem.word(), (test) => {
                    test(name, lorem.sentence(), () => { throw new Error(); });
                    test(lorem.word(), lorem.sentence(), noop);
                });
                expect(instance.res.async).to.equal(false);
            });

            it('should mark a test as failed for `false`', () => {
                const name = lorem.word();
                instance = new Passable(lorem.word(), (test) => {
                    test(name, lorem.sentence(), () => false);
                    test(lorem.word(), lorem.sentence(), noop);
                });
                expect(instance.res.failCount).to.equal(1);
                expect(instance.res.validationErrors).to.have.key(name);
            });

            it('should implicitly pass test', () => {
                const name = lorem.word();
                instance = new Passable(lorem.word(), (test) => {
                    test(name, lorem.sentence(), noop);
                });
                expect(instance.res.failCount).to.equal(0);
                expect(instance.res.testCount).to.equal(1);
            });
        });
    });
});