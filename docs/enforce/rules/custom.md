# Custom `enforce` rules
To make it easier to reuse logic across your application, sometimes you would want to encapsulate bits of logic in rules that you can use later on, for example, "what's considered a valid email".

Your custom rules are essentially a single javascript object containing your rules.
```js
const myCustomRules = {
    isValidEmail: (value) => value.indexOf('@') > -1,
    hasKey: (value, {key}) => value.hasOwnProperty(key),
    passwordsMatch: (passConfirm, options) => passConfirm === options.passConfirm && options.passIsValid
}
```
Just like the predefined rules, your custom rules can accepts two parameters:
* `value` The actual value you are testing against.
* `args` (optional) the arguments which you pass on when running your tests.

## Extending `Enforce` with custom rules
> Since 6.0.0

You can add your custom rules directly to enforce to allow reusability. As describe in [enforce](../README.md), you simply need to create a new instance of `Enforce` and add the rules as the argument.

```js
import passable, { Enforce } from 'passable';

const myCustomRules = {
    isValidEmail: (value) => value.indexOf('@') > -1,
    hasKey: (value, key) => value.hasOwnProperty(key),
    passwordsMatch: (passConfirm, options) => passConfirm === options.passConfirm && options.passIsValid
}

const enforce = new Enforce(myCustomRules);

passable('GroupName', (test) => {
    test('TestName', 'Must have a valid email', () => {
        enforce(user.email).isValidEmail();
    });
});
```