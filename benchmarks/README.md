# @egomobile/http-server benchmarks

The benchmarks were recorded with [wrk](https://github.com/wg/wrk) by executing the following command:

```bash
wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

## Results

### Node v14.19.3

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
    Latency     7.06ms    1.48ms  51.25ms   89.48%
    Req/Sec     1.71k   267.27    12.43k    97.58%
  409336 requests in 30.11s, 60.12MB read
Requests/sec:  13596.88
Transfer/sec:      2.00MB
```

#### [fastify](https://github.com/fastify/fastify)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     6.68ms    1.60ms  50.43ms   85.55%
    Req/Sec     1.81k   159.83     2.05k    95.00%
  432715 requests in 30.02s, 71.39MB read
Requests/sec:  14413.68
Transfer/sec:      2.38MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.75ms  716.62us  43.50ms   97.49%
    Req/Sec     4.41k   334.19     4.92k    96.55%
  1057578 requests in 30.10s, 132.12MB read
Requests/sec:  35130.76
Transfer/sec:      4.39MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.66ms  664.51us  39.81ms   96.93%
    Req/Sec     4.56k   353.39     5.27k    94.97%
  1093399 requests in 30.10s, 136.60MB read
Requests/sec:  36319.57
Transfer/sec:      4.54MB
```
