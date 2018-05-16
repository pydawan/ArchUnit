'use strict';

const expect = require('chai').expect;
const nodePredicates = require('./main-files').get('predicates');

const testStringContains = (subString) => ({
  against: input => ({
    is: expected => {
      it(`stringContains('${subString}')('${input}') == ${expected}`, () => {
        expect(nodePredicates.stringContains(subString)(input)).to.equal(expected);
      });
    }
  })
});

describe('matching strings by checking for a certain substring', () => {
  describe('simple substrings', () => {
    testStringContains('foo').against('foobar').is(true);
    testStringContains('oba').against('foobar').is(true);
    testStringContains('bar').against('foobar').is(true);
    testStringContains('foobar').against('foobar').is(true);

    testStringContains('for').against('foobar').is(false);
  });

  describe('leading whitespace is ignored', () => {
    testStringContains(' foo').against('foobar').is(true);
    testStringContains('   foobar').against('foobar').is(true);

    testStringContains('fooar').against('foobar').is(false);
  });

  describe('substrings with trailing whitespace must end with pattern', () => {
    testStringContains('bar ').against('foobar').is(true);
    testStringContains('bar    ').against('foobar').is(true);
    testStringContains(' bar ').against('foobar').is(true);

    testStringContains('foo ').against('foobar').is(false);
    testStringContains('fooba ').against('foobar').is(false);
  });

  describe('only the asterisk (*) is interpreted as wildcard', () => {
    testStringContains('f*ar').against('foobar').is(true);
    testStringContains('some.r*.*Class').against('some.random.Class').is(true);
    testStringContains('.$?[]\\^+').against('.$?[]\\^+').is(true);

    testStringContains('some.r*.*Class').against('some.randomClass').is(false);
    testStringContains('.$?[]\\^+').against('.$?[.\\^+').is(false);
  });

  describe('| separates different options', () => {
    testStringContains('fo|ba').against('foo').is(true);
    testStringContains('fo|ba').against('bar').is(true);
    testStringContains('fo|ba|te').against('test').is(true);

    testStringContains('fo|ba').against('anyOther').is(false);
    testStringContains('fo|ba|te').against('notMatching').is(false);
  });

  describe('leading whitespaces before | are ignored', () => {
    testStringContains(' fo| ba').against('foo').is(true);
    testStringContains(' fo| ba').against('bar').is(true);
    testStringContains(' fo|   ba').against('bar').is(true);
    testStringContains(' fo| ba| te').against('test').is(true);

    testStringContains(' fo| ba').against('anyOther').is(false);
  });

  describe('substrings with whitespaces before | must end with one of the optional patterns', () => {
    testStringContains('foo |bar ').against('foo').is(true);
    testStringContains('foo |bar ').against('bar').is(true);
    testStringContains('foo |bar |test ').against('test').is(true);

    testStringContains('foo |bar ').against('fo').is(false);
    testStringContains('foo |bar ').against('ba').is(false);
    testStringContains('foo |bar |test ').against('test1').is(false);

  });

  describe('some typical scenarios when filtering fully qualified class names', () => {
    testStringContains('SimpleClass').against('my.company.SimpleClass').is(true);
    testStringContains('Json').against('some.evil.long.pkg.JsonParser').is(true);
    testStringContains('Json ').against('some.evil.long.pkg.JsonParser').is(false);

    testStringContains('pkg').against('some.evil.long.pkg.SomeClass').is(true);
    testStringContains('.pkg.').against('some.evil.long.pkg.SomeClass').is(true);
    testStringContains('.long.pkg.').against('some.evil.long.pkg.SomeClass').is(true);
    testStringContains('.pk.').against('some.evil.long.pkg.SomeClass').is(false);
    testStringContains('.evil..pkg.').against('some.evil.long.pkg.SomeClass').is(false);
  });
});

describe('matching inverted predicates via "not"', () => {
  it("should match iff original predicate doesn't", () => {
    expect(nodePredicates.not(() => true)('anything')).to.equal(false);
    expect(nodePredicates.not(() => false)('anything')).to.equal(true);
  })
});

const testAnd = (...bools) => ({
  evaluatesTo: (expected) => {
    it(`should evaluate to ${expected}, if the supplied predicates evaluate to ${bools}`, () => {
      const predicates = bools.map(b => () => b);
      expect(nodePredicates.and(...predicates)('anything')).to.equal(expected);
    })
  }
});

describe('AND-ing predicates via "and"', () => {
  testAnd(true, true).evaluatesTo(true);
  testAnd(false, true).evaluatesTo(false);
  testAnd(true, false).evaluatesTo(false);
  testAnd(false, false).evaluatesTo(false);
  testAnd(true, false, true).evaluatesTo(false);
  testAnd(true, true, false).evaluatesTo(false);
  testAnd(true, true, true, false).evaluatesTo(false);
  testAnd(true, true, false, true).evaluatesTo(false);
  testAnd(true, true, true, true).evaluatesTo(true);
});