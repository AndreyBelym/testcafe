'@fixture quarantine-mode';
'@page ./runner/regression/fails-by-request.html';

'@test'['Wait 200ms'] = {
    '1. Wait 200ms': function () {
        act.wait(200);
    }

};
