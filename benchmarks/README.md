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
    Latency     7.17ms    1.55ms  52.46ms   90.49%
    Req/Sec     1.69k   152.25     1.91k    93.58%
  403184 requests in 30.02s, 59.21MB read
Requests/sec:  13431.47
Transfer/sec:      1.97MB
```

#### [fastify](https://github.com/fastify/fastify)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     6.39ms    1.68ms  56.27ms   86.06%
    Req/Sec     1.90k   173.71     2.18k    95.33%
  453547 requests in 30.02s, 74.40MB read
Requests/sec:  15107.04
Transfer/sec:      2.48MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.83ms  730.78us  41.88ms   97.21%
    Req/Sec     4.29k   331.44     5.36k    94.76%
  1028436 requests in 30.10s, 128.48MB read
Requests/sec:  34162.46
Transfer/sec:      4.27MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.58ms  702.54us  50.60ms   96.53%
    Req/Sec     4.71k   413.76     9.06k    95.80%
  1126136 requests in 30.10s, 140.69MB read
Requests/sec:  37407.79
Transfer/sec:      4.67MB
```
