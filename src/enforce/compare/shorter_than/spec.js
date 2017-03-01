'use strict'

import chai from 'chai';
import shorterThan from './index';

const expect = chai.expect;

describe('Tests shorterThan module', () => {

    it('Should return false for an array longer than 5', () => {
        expect(shorterThan([1,2,3,4,5,6], {testAgainst: 5})).to.equal(false);
    });

    it('Should return true for an array shorter than 8', () => {
        expect(shorterThan([1,2,3,4,5,6], {testAgainst: 8})).to.equal(true);
    });

    it('Should return false for a string longer than 3', () => {
        expect(shorterThan("abcd", {testAgainst: 3})).to.equal(false);
    });
});