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
- OS: MacOS 12.1

#### [Express](https://expressjs.com/)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     6.76ms    1.39ms  40.85ms   86.95%
    Req/Sec     1.79k   283.21    13.43k    97.00%
  426942 requests in 30.10s, 62.70MB read
Requests/sec:  14182.35
Transfer/sec:      2.08MB
```

#### [fastify](https://github.com/fastify/fastify)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     6.28ms    1.57ms  49.39ms   84.69%
    Req/Sec     1.93k   174.08     2.64k    94.54%
  460390 requests in 30.03s, 75.52MB read
Requests/sec:  15332.76
Transfer/sec:      2.52MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.80ms  747.93us  43.11ms   96.48%
    Req/Sec     4.34k   369.08     6.78k    93.51%
  1038529 requests in 30.10s, 129.74MB read
Requests/sec:  34496.92
Transfer/sec:      4.31MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.64ms  684.89us  42.46ms   95.68%
    Req/Sec     4.59k   420.33     9.18k    94.22%
  1099166 requests in 30.10s, 137.32MB read
Requests/sec:  36513.48
Transfer/sec:      4.56MB
```
