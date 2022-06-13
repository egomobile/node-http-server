# @egomobile/http-server benchmarks

The benchmarks were recorded with [wrk](https://github.com/wg/wrk) by executing the following command:

```bash
wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

## Results

### Node v14.18.3

Machine:

- MacBook Pro (15-inch, 2018)
- CPU: 2,9 GHz 6-Core Intel Core i9
- Memory: 32 GB 2400 MHz DDR4
- OS: MacOS 12.4

#### [Express](https://expressjs.com/)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     7.18ms    1.34ms  38.68ms   89.35%
    Req/Sec     1.68k   134.66     1.89k    92.67%
  401745 requests in 30.01s, 59.00MB read
Requests/sec:  13385.25
Transfer/sec:      1.97MB
```

#### [fastify](https://github.com/fastify/fastify)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     7.18ms    1.67ms  53.86ms   87.03%
    Req/Sec     1.69k   153.73     2.30k    96.00%
  402881 requests in 30.02s, 66.47MB read
Requests/sec:  13419.19
Transfer/sec:      2.21MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.79ms  750.94us  42.69ms   96.96%
    Req/Sec     4.35k   666.95    32.27k    97.96%
  1038445 requests in 30.10s, 129.73MB read
Requests/sec:  34497.68
Transfer/sec:      4.31MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.54ms  665.16us  40.59ms   95.42%
    Req/Sec     4.77k   770.79    37.54k    98.63%
  1140525 requests in 30.10s, 142.49MB read
Requests/sec:  37892.38
Transfer/sec:      4.73MB
```
